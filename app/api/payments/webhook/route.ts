import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, stripeService } from "@/lib/stripe";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const requestHeaders = await headers();
    const signature = requestHeaders.get("stripe-signature");

    if (!signature) {
      console.error("[Webhook] No stripe-signature header found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] No webhook secret configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify webhook signature
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle the event
    const result = await stripeService.handleWebhook(event);

    if (result.processed) {
      return NextResponse.json({ received: true });
    } else {
      console.error("[Webhook] Failed to process event:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
