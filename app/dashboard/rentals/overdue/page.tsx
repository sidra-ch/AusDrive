"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Badge, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Rental = { id: number; customer_name: string; customer_phone: string; make: string; model: string; expected_return: string; total_amount: number; balance: number; status: string; };

export default function OverdueRentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rentals?status=overdue")
      .then((r) => r.json())
      .then((d) => { setRentals(d.rentals ?? []); setLoading(false); });
  }, []);

  return (
    <PageWrapper>
      <SectionHeader title="Overdue Rentals" subtitle={loading ? "Loading..." : `${rentals.length} require immediate action`} />
      {loading ? <div className="py-12 text-center text-muted-foreground">Loading...</div> : (
        <Table>
          <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Phone</Th><Th>Car</Th><Th>Was Due</Th><Th>Overdue By</Th><Th>Balance</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rentals.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No overdue rentals.</td></tr>}
            {rentals.map((r) => (
              <tr key={r.id} className="hover:bg-white/3 transition cursor-pointer" onClick={() => router.push(`/dashboard/rentals/${r.id}`)}>
                <Td><span className="font-mono text-cyan-400">R-{r.id}</span></Td>
                <Td>{r.customer_name}</Td>
                <Td className="text-muted-foreground">{r.customer_phone ?? "-"}</Td>
                <Td>{r.make} {r.model}</Td>
                <Td className="text-rose-400 font-medium">{format(new Date(r.expected_return), "d MMM yyyy")}</Td>
                <Td className="text-rose-300 font-bold">{formatDistanceToNow(new Date(r.expected_return))} ago</Td>
                <Td className="text-rose-400 font-bold">${parseFloat(String(r.balance)).toFixed(2)}</Td>
                <Td><Badge label="overdue" variant="danger" /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
