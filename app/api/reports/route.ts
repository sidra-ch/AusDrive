import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "revenue";

  const schemaRows = await query<{
    legacy_payments: string | null;
    legacy_rentals: string | null;
    legacy_cars: string | null;
    legacy_maintenance: string | null;
    legacy_customers: string | null;
    prisma_payment: string | null;
    prisma_booking: string | null;
    prisma_car: string | null;
    prisma_maintenance: string | null;
    prisma_user: string | null;
    car_plate_number: boolean;
    car_plate: boolean;
    car_category: boolean;
    booking_car_id: boolean;
    booking_user_id: boolean;
    booking_pickup_date: boolean;
    booking_dropoff_date: boolean;
    booking_total_amount: boolean;
    payment_booking_id: boolean;
    payment_created_at: boolean;
    maintenance_car_id: boolean;
    maintenance_cost: boolean;
    maintenance_created_at: boolean;
  }>(`SELECT
      to_regclass('public.payments') AS legacy_payments,
      to_regclass('public.rentals') AS legacy_rentals,
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public.maintenance') AS legacy_maintenance,
      to_regclass('public.customers') AS legacy_customers,
      to_regclass('public."Payment"') AS prisma_payment,
      to_regclass('public."Booking"') AS prisma_booking,
      to_regclass('public."Car"') AS prisma_car,
      to_regclass('public."MaintenanceRecord"') AS prisma_maintenance,
      to_regclass('public."User"') AS prisma_user,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plateNumber') AS car_plate_number,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plate') AS car_plate,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='category') AS car_category,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='carId') AS booking_car_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='userId') AS booking_user_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='pickupDate') AS booking_pickup_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dropoffDate') AS booking_dropoff_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalAmount') AS booking_total_amount,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Payment' AND column_name='bookingId') AS payment_booking_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Payment' AND column_name='createdAt') AS payment_created_at,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='MaintenanceRecord' AND column_name='carId') AS maintenance_car_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='MaintenanceRecord' AND column_name='cost') AS maintenance_cost,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='MaintenanceRecord' AND column_name='createdAt') AS maintenance_created_at`);

  const schema = schemaRows[0];
  const prismaPlateExpr = schema?.car_plate_number ? 'ca."plateNumber"' : schema?.car_plate ? "ca.plate" : "NULL::text";

  if (type === "revenue") {
    const data = schema?.legacy_payments
      ? await query(
          `SELECT DATE_TRUNC('month', created_at) as period,
           COUNT(*) as transactions, SUM(amount) as total
           FROM payments GROUP BY period ORDER BY period DESC LIMIT 12`
        )
      : schema?.prisma_payment
      ? await query(
          `SELECT DATE_TRUNC('month', ${schema?.payment_created_at ? '"createdAt"' : "NOW()"}) as period,
           COUNT(*) as transactions, SUM(amount) as total
           FROM "Payment" GROUP BY period ORDER BY period DESC LIMIT 12`
        )
      : [];
    return NextResponse.json({ data });
  }

  if (type === "utilisation") {
    const data = schema?.legacy_cars && schema?.legacy_rentals
      ? await query(
          `SELECT ca.id, ca.make, ca.model, ca.plate, ca.category,
           COUNT(r.id) as total_rentals,
           COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(r.actual_return, NOW()) - r.start_date))/86400), 0) as rented_days
           FROM cars ca LEFT JOIN rentals r ON r.car_id = ca.id
           GROUP BY ca.id ORDER BY rented_days DESC`
        )
      : schema?.prisma_car && schema?.prisma_booking && schema?.booking_car_id
      ? await query(
          `SELECT ca.id, ca.make, ca.model, ${prismaPlateExpr} AS plate,
           ${schema?.car_category ? "initcap(replace(ca.category::text, '_', ' '))" : "NULL::text"} AS category,
           COUNT(b.id) as total_rentals,
           COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(${schema?.booking_dropoff_date ? 'b."dropoffDate"' : "NOW()"}, NOW()) - COALESCE(${schema?.booking_pickup_date ? 'b."pickupDate"' : "NOW()"}, NOW())))/86400), 0) as rented_days
           FROM "Car" ca LEFT JOIN "Booking" b ON b."carId" = ca.id
           GROUP BY ca.id, ca.make, ca.model, ${prismaPlateExpr}, ${schema?.car_category ? "ca.category" : "NULL::text"}
           ORDER BY rented_days DESC`
        )
      : [];
    return NextResponse.json({ data });
  }

  if (type === "car_profit") {
    const data = schema?.legacy_cars && schema?.legacy_rentals && schema?.legacy_payments
      ? await query(
          `SELECT ca.id, ca.make, ca.model, ca.plate,
           COALESCE(SUM(p.amount), 0) as revenue,
           COALESCE(SUM(m.cost), 0) as maintenance_cost,
           COALESCE(SUM(p.amount), 0) - COALESCE(SUM(m.cost), 0) as profit
           FROM cars ca
           LEFT JOIN rentals r ON r.car_id = ca.id
           LEFT JOIN payments p ON p.rental_id = r.id
           LEFT JOIN maintenance m ON m.car_id = ca.id
           GROUP BY ca.id ORDER BY profit DESC`
        )
      : schema?.prisma_car
      ? await query(
          `SELECT ca.id, ca.make, ca.model, ${prismaPlateExpr} AS plate,
           COALESCE(SUM(p.amount), 0) as revenue,
           COALESCE(SUM(m.cost), 0) as maintenance_cost,
           COALESCE(SUM(p.amount), 0) - COALESCE(SUM(m.cost), 0) as profit
           FROM "Car" ca
           ${schema?.prisma_booking && schema?.booking_car_id ? 'LEFT JOIN "Booking" b ON b."carId" = ca.id' : 'LEFT JOIN LATERAL (SELECT NULL::text AS id) b ON true'}
           ${schema?.prisma_payment && schema?.payment_booking_id ? 'LEFT JOIN "Payment" p ON p."bookingId" = b.id' : 'LEFT JOIN LATERAL (SELECT 0::numeric AS amount) p ON true'}
           ${schema?.prisma_maintenance && schema?.maintenance_car_id ? 'LEFT JOIN "MaintenanceRecord" m ON m."carId" = ca.id' : 'LEFT JOIN LATERAL (SELECT 0::numeric AS cost) m ON true'}
           GROUP BY ca.id, ca.make, ca.model, ${prismaPlateExpr}
           ORDER BY profit DESC`
        )
      : [];
    return NextResponse.json({ data });
  }

  if (type === "maintenance_cost") {
    const data = schema?.legacy_maintenance && schema?.legacy_cars
      ? await query(
          `SELECT ca.make, ca.model, ca.plate,
           COUNT(m.id) as service_count, SUM(m.cost) as total_cost
           FROM maintenance m JOIN cars ca ON ca.id = m.car_id
           GROUP BY ca.id, ca.make, ca.model, ca.plate ORDER BY total_cost DESC`
        )
      : schema?.prisma_maintenance && schema?.prisma_car && schema?.maintenance_car_id
      ? await query(
          `SELECT ca.make, ca.model, ${prismaPlateExpr} AS plate,
           COUNT(m.id) as service_count,
           SUM(${schema?.maintenance_cost ? "m.cost" : "0::numeric"}) as total_cost
           FROM "MaintenanceRecord" m JOIN "Car" ca ON ca.id = m."carId"
           GROUP BY ca.id, ca.make, ca.model, ${prismaPlateExpr}
           ORDER BY total_cost DESC`
        )
      : [];
    return NextResponse.json({ data });
  }

  if (type === "pending_payments") {
    const data = schema?.legacy_rentals
      ? await query(
          `SELECT r.id as rental_id, c.name as customer, ca.make, ca.model,
           r.total_amount, COALESCE(SUM(p.amount), 0) as paid,
           r.total_amount - COALESCE(SUM(p.amount), 0) as balance
           FROM rentals r
           LEFT JOIN customers c ON c.id = r.customer_id
           LEFT JOIN cars ca ON ca.id = r.car_id
           LEFT JOIN payments p ON p.rental_id = r.id
           GROUP BY r.id, c.name, ca.make, ca.model
           HAVING r.total_amount - COALESCE(SUM(p.amount), 0) > 0
           ORDER BY balance DESC`
        )
      : schema?.prisma_booking
      ? await query(
          `SELECT b.id as rental_id,
           ${schema?.booking_user_id && schema?.prisma_user ? "u.name" : schema?.booking_user_id ? 'b."userId"::text' : "'Unknown'::text"} as customer,
           ca.make, ca.model,
           ${schema?.booking_total_amount ? 'b."totalAmount"' : "0::numeric"} as total_amount,
           COALESCE(SUM(p.amount), 0) as paid,
           ${schema?.booking_total_amount ? 'b."totalAmount"' : "0::numeric"} - COALESCE(SUM(p.amount), 0) as balance
           FROM "Booking" b
           ${schema?.prisma_car && schema?.booking_car_id ? 'LEFT JOIN "Car" ca ON ca.id = b."carId"' : 'LEFT JOIN LATERAL (SELECT NULL::text AS make, NULL::text AS model) ca ON true'}
           ${schema?.prisma_user && schema?.booking_user_id ? 'LEFT JOIN "User" u ON u.id = b."userId"' : ""}
           ${schema?.prisma_payment && schema?.payment_booking_id ? 'LEFT JOIN "Payment" p ON p."bookingId" = b.id' : ""}
           GROUP BY b.id, ${schema?.booking_user_id && schema?.prisma_user ? "u.name" : schema?.booking_user_id ? 'b."userId"' : "NULL::text"}, ca.make, ca.model, ${schema?.booking_total_amount ? 'b."totalAmount"' : "0::numeric"}
           HAVING ${schema?.booking_total_amount ? 'b."totalAmount"' : "0::numeric"} - COALESCE(SUM(p.amount), 0) > 0
           ORDER BY balance DESC`
        )
      : [];
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
