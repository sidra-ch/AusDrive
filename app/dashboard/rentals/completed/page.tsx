"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Rental = { id: number; customer_name: string; make: string; model: string; start_date: string; actual_return: string | null; expected_return: string; total_amount: number; status: string; };

export default function CompletedRentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rentals?status=completed")
      .then((r) => r.json())
      .then((d) => { setRentals(d.rentals ?? []); setLoading(false); });
  }, []);

  return (
    <PageWrapper>
      <SectionHeader title="Completed Rentals" subtitle={loading ? "Loading..." : `${rentals.length} historical records`} />
      {loading ? <div className="py-12 text-center text-muted-foreground">Loading...</div> : (
        <Table>
          <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Returned</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rentals.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No completed rentals.</td></tr>}
            {rentals.map((r) => (
              <tr key={r.id} className="hover:bg-white/3 transition cursor-pointer" onClick={() => router.push(`/dashboard/rentals/${r.id}`)}>
                <Td><span className="font-mono text-cyan-400">R-{r.id}</span></Td>
                <Td>{r.customer_name}</Td>
                <Td>{r.make} {r.model}</Td>
                <Td>{format(new Date(r.start_date), "d MMM yy")}</Td>
                <Td>{r.actual_return ? format(new Date(r.actual_return), "d MMM yy") : format(new Date(r.expected_return), "d MMM yy")}</Td>
                <Td className="font-semibold text-foreground">${parseFloat(String(r.total_amount)).toFixed(2)}</Td>
                <Td><Badge label="completed" variant="neutral" /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
