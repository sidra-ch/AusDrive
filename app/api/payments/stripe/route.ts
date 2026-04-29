import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import Stripe from "stripe";

interface CustomerRow { id: unknown; email: string; name: string; phone: string; }
interface RentalRow { customer_id: unknown; }

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rentalId, customerId, amount, paymentMethodId, recurring } = await req.json();

    if (!rentalId || !amount || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get rental & customer details
    const rental = await query<RentalRow>("SELECT * FROM rentals WHERE id = $1", [rentalId]);
    if (!rental.length) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    const customer = await query<CustomerRow>("SELECT * FROM customers WHERE id = $1", [customerId || rental[0].customer_id]);
    if (!customer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Create Stripe customer if doesn't exist
    const customerList = await stripe.customers.list({ email: customer[0].email, limit: 1 });
    let stripeCustomerId: string;
    if (customerList.data.length === 0) {
      const newCust = await stripe.customers.create({
        email: customer[0].email,
        name: customer[0].name,
        phone: customer[0].phone,
      });
      stripeCustomerId = newCust.id;
    } else {
      stripeCustomerId = customerList.data[0].id;
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Create payment intent
    let paymentIntent;
    if (recurring) {
      // Setup for recurring payment
      paymentIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
      });
    } else {
      // One-time payment
      paymentIntent = await stripe.paymentIntents.create({
        customer: stripeCustomerId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: "aud",
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`,
      });
    }

    // Record in database
    const payment = await query(
      "INSERT INTO payments (rental_id, customer_id, amount, method, stripe_id, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        rentalId,
        customer[0].id,
        amount,
        "Stripe",
        paymentIntent.id,
        "status" in paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") ? "paid" : "partial",
        String(session.sub),
      ]
    );

    // Send confirmation email
    if ("status" in paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer[0].email,
          templateId: "d-payment-confirmation",
          dynamicTemplateData: {
            customer_name: customer[0].name,
            amount: amount.toFixed(2),
            rental_id: rentalId,
          },
        }),
      });
    }

    return NextResponse.json({ payment: payment[0], paymentIntent });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}

// Webhook handler
export async function PUT(req: NextRequest) {
  try {
    const stripe = getStripe();
    const sig = req.headers.get("stripe-signature") || "";
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );

    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await query(
        "UPDATE payments SET status = $1 WHERE stripe_id = $2",
        ["paid", paymentIntent.id]
      );
    }

    // Handle payment intent payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await query(
        "UPDATE payments SET status = $1 WHERE stripe_id = $2",
        ["failed", paymentIntent.id]
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
