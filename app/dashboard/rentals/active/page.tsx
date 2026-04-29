"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Rental = { id: number; customer_name: string; make: string; model: string; start_date: string; expected_return: string; total_amount: number; balance: number; status: string; };

export default function ActiveRentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rentals?status=active")
      .then((r) => r.json())
      .then((d) => { setRentals(d.rentals ?? []); setLoading(false); });
  }, []);

  return (
    <PageWrapper>
      <SectionHeader title="Active Rentals" subtitle={loading ? "Loading..." : `${rentals.length} currently on road`} />
      {loading ? <div className="py-12 text-center text-muted-foreground">Loading...</div> : (
        <Table>
          <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Due Back</Th><Th>Amount</Th><Th>Balance</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rentals.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No active rentals.</td></tr>}
            {rentals.map((r) => (
              <tr key={r.id} className="hover:bg-white/3 transition cursor-pointer" onClick={() => router.push(`/dashboard/rentals/${r.id}`)}>
                <Td><span className="font-mono text-cyan-400">R-{r.id}</span></Td>
                <Td>{r.customer_name}</Td>
                <Td>{r.make} {r.model}</Td>
                <Td>{format(new Date(r.start_date), "d MMM yy")}</Td>
                <Td>{format(new Date(r.expected_return), "d MMM yy")}</Td>
                <Td className="font-semibold text-foreground">${parseFloat(String(r.total_amount)).toFixed(2)}</Td>
                <Td className={parseFloat(String(r.balance)) > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>${parseFloat(String(r.balance)).toFixed(2)}</Td>
                <Td><Badge label={r.status} variant="success" /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
