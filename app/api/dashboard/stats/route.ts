import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

async function getSessionFromRequest(req: NextRequest) {
  let session = await getSession();
  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await verifyToken(authHeader.slice(7));
    }
  }
  return session;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  try {
    // Detect schema
    const tables = await queryOne<{
      legacy_cars: string | null; prisma_car: string | null;
      legacy_payments: string | null; prisma_payment: string | null;
      legacy_customers: string | null; prisma_user: string | null;
      prisma_booking: string | null; legacy_rentals: string | null;
    }>(
      `SELECT
        to_regclass('public.cars') AS legacy_cars,
        to_regclass('public."Car"') AS prisma_car,
        to_regclass('public.payments') AS legacy_payments,
        to_regclass('public."Payment"') AS prisma_payment,
        to_regclass('public.customers') AS legacy_customers,
        to_regclass('public."User"') AS prisma_user,
        to_regclass('public."Booking"') AS prisma_booking,
        to_regclass('public.rentals') AS legacy_rentals`
    );

    const useLegacy = Boolean(tables?.legacy_cars) && !tables?.prisma_car;
    const hasPrismaPayment = Boolean(tables?.prisma_payment);
    const hasPrismaBooking = Boolean(tables?.prisma_booking);
    const hasPrismaUser = Boolean(tables?.prisma_user);
    const hasPrismaCar = Boolean(tables?.prisma_car);

    let kpis: Record<string, number> = {};
    let recentRentals: unknown[] = [];
    let pendingPayments: unknown[] = [];
    let revenueChart: unknown[] = [];

    if (useLegacy && tables?.legacy_cars) {
      // Legacy schema
      const [totalCars, availableCars, rentedCars, maintCars, totalCustomers, activeRentals, overdueRentals, todayRev, monthRev, totalRev, dueToday] = await Promise.all([
        queryOne<{ count: string }>("SELECT COUNT(*) FROM cars"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'available'"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'rented'"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'maintenance'"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM customers WHERE status = 'active'"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE status = 'active'"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE status = 'overdue'"),
        queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE DATE(created_at)=CURRENT_DATE"),
        queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())"),
        queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount),0) as sum FROM payments"),
        queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE DATE(expected_return)=CURRENT_DATE AND status='active'"),
      ]);
      kpis = {
        totalCars: parseInt(totalCars?.count ?? "0"),
        availableCars: parseInt(availableCars?.count ?? "0"),
        rentedCars: parseInt(rentedCars?.count ?? "0"),
        maintenanceCars: parseInt(maintCars?.count ?? "0"),
        totalCustomers: parseInt(totalCustomers?.count ?? "0"),
        activeRentals: parseInt(activeRentals?.count ?? "0"),
        overdueRentals: parseInt(overdueRentals?.count ?? "0"),
        dueToday: parseInt(dueToday?.count ?? "0"),
        todayRevenue: parseFloat(todayRev?.sum ?? "0"),
        monthRevenue: parseFloat(monthRev?.sum ?? "0"),
        totalRevenue: parseFloat(totalRev?.sum ?? "0"),
        todayViews: 0,
      };
      recentRentals = await query(`SELECT r.id, r.status, r.total_amount, r.start_date, r.expected_return, c.name as customer_name, ca.make, ca.model, ca.plate FROM rentals r LEFT JOIN customers c ON c.id=r.customer_id LEFT JOIN cars ca ON ca.id=r.car_id ORDER BY r.created_at DESC LIMIT 5`);
    } else if (hasPrismaCar) {
      // Prisma/NeonDB schema
      const [totalCars, availableCars, rentedCars, totalCustomers, activeRentals, overdueRentals, todayRev, monthRev, totalRev] = await Promise.all([
        queryOne<{ count: string }>('SELECT COUNT(*) FROM "Car"'),
        queryOne<{ count: string }>('SELECT COUNT(*) FROM "Car" WHERE "isAvailable"=true'),
        queryOne<{ count: string }>('SELECT COUNT(*) FROM "Car" WHERE "isAvailable"=false'),
        hasPrismaUser ? queryOne<{ count: string }>('SELECT COUNT(*) FROM "User" WHERE role=\'USER\'') : Promise.resolve({ count: "0" }),
        hasPrismaBooking ? queryOne<{ count: string }>('SELECT COUNT(*) FROM "Booking" WHERE lower(status) IN (\'active\',\'confirmed\')') : Promise.resolve({ count: "0" }),
        hasPrismaBooking ? queryOne<{ count: string }>('SELECT COUNT(*) FROM "Booking" WHERE lower(status) = \'overdue\'') : Promise.resolve({ count: "0" }),
        hasPrismaPayment ? queryOne<{ sum: string }>('SELECT COALESCE(SUM(amount),0) as sum FROM "Payment" WHERE DATE("createdAt")=CURRENT_DATE') : Promise.resolve({ sum: "0" }),
        hasPrismaPayment ? queryOne<{ sum: string }>('SELECT COALESCE(SUM(amount),0) as sum FROM "Payment" WHERE DATE_TRUNC(\'month\',"createdAt")=DATE_TRUNC(\'month\',NOW())') : Promise.resolve({ sum: "0" }),
        hasPrismaPayment ? queryOne<{ sum: string }>('SELECT COALESCE(SUM(amount),0) as sum FROM "Payment"') : Promise.resolve({ sum: "0" }),
      ]);
      kpis = {
        totalCars: parseInt(totalCars?.count ?? "0"),
        availableCars: parseInt(availableCars?.count ?? "0"),
        rentedCars: parseInt(rentedCars?.count ?? "0"),
        maintenanceCars: 0,
        totalCustomers: parseInt(totalCustomers?.count ?? "0"),
        activeRentals: parseInt(activeRentals?.count ?? "0"),
        overdueRentals: parseInt(overdueRentals?.count ?? "0"),
        dueToday: 0,
        todayRevenue: parseFloat(todayRev?.sum ?? "0"),
        monthRevenue: parseFloat(monthRev?.sum ?? "0"),
        totalRevenue: parseFloat(totalRev?.sum ?? "0"),
        todayViews: 0,
      };

      if (hasPrismaBooking) {
        recentRentals = await query(
          `SELECT b.id::text AS id, b.status, b."totalPrice" AS total_amount,
            b."pickupDate" AS start_date, b."dropoffDate" AS expected_return,
            COALESCE(u.name,'Unknown') AS customer_name,
            ca.make, ca.model, ca.rego AS plate
          FROM "Booking" b
          LEFT JOIN "User" u ON u.id=b."userId"
          LEFT JOIN "Car" ca ON ca.id=b."carId"
          ORDER BY b."createdAt" DESC LIMIT 5`
        );
      }
      if (hasPrismaPayment) {
        pendingPayments = await query(
          `SELECT p.id::text AS id, p.amount, p.status, p."paymentMethod" AS method,
            p."createdAt" AS created_at, COALESCE(u.name,'Unknown') AS customer_name
          FROM "Payment" p
          LEFT JOIN "Booking" b ON b.id=p."bookingId"
          LEFT JOIN "User" u ON u.id=b."userId"
          WHERE lower(p.status) IN ('pending','failed')
          ORDER BY p."createdAt" DESC LIMIT 5`
        );
        revenueChart = await query<{ month: string; revenue: string }>(
          `SELECT TO_CHAR(DATE_TRUNC('month',"createdAt"),'Mon YYYY') as month,
            COALESCE(SUM(amount),0) as revenue
          FROM "Payment"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month',"createdAt")
          ORDER BY DATE_TRUNC('month',"createdAt")`
        );
      }
    }

    return handleCORS(NextResponse.json({ kpis, recentRentals, pendingPayments, revenueChart }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Dashboard Stats]", err);
    return handleCORS(NextResponse.json({ error: "Failed to load stats" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

