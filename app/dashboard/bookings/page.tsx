"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Badge, Card, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Booking = {
  id: number;
  car_make: string;
  car_model: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
};

function safeDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy");
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setBookings(d.bookings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageWrapper>
      <SectionHeader
        title="Bookings"
        subtitle="Upcoming reservations"
        action={
          <Link href="/dashboard/bookings/new">
            <PrimaryBtn><Plus className="h-4 w-4" /> New Booking</PrimaryBtn>
          </Link>
        }
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Booking Calendar</h3>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" />Confirmed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Cancelled</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Calendar view coming in Phase 2.</p>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading bookings...</div>
      ) : (
        <Table>
          <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>End</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No bookings found.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-white/3 transition">
                <Td><span className="font-mono text-cyan-400">BK-{b.id}</span></Td>
                <Td>{b.customer_name}</Td>
                <Td>{b.car_make} {b.car_model}</Td>
                <Td>{safeDate(b.start_date)}</Td>
                <Td>{safeDate(b.end_date)}</Td>
                <Td>${parseFloat(String(b.total_amount)).toFixed(2)}</Td>
                <Td>
                  <Badge label={b.status} variant={b.status === "confirmed" ? "success" : b.status === "pending" ? "warning" : "danger"} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
