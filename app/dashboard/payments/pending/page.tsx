"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Badge, GhostBtn, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type PendingItem = Record<string, unknown>;

function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }

export default function PendingPaymentsPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/reports?type=pending_payments")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setItems(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const totalBalance = items.reduce((s, i) => s + parseFloat(String(i.balance ?? 0)), 0);

  return (
    <PageWrapper>
      <SectionHeader
        title="Pending Payments"
        subtitle={`${items.length} rentals with outstanding balance`}
        action={<GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn>}
      />

      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/8 p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Outstanding Balance</p>
        <p className="mt-1 text-3xl font-bold text-rose-400">{fmt(totalBalance)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div>
      ) : (
        <Table>
          <thead>
            <tr><Th>Rental</Th><Th>Customer</Th><Th>Car</Th><Th>Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Action</Th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={String(item.rental_id)} className="hover:bg-white/3 transition">
                <Td><Link href={`/dashboard/rentals/${item.rental_id}`}><span className="font-mono text-cyan-400">#{String(item.rental_id)}</span></Link></Td>
                <Td>{String(item.customer ?? "-")}</Td>
                <Td className="text-muted-foreground">{String(item.make ?? "")} {String(item.model ?? "")}</Td>
                <Td className="font-semibold text-foreground">{fmt(item.total_amount)}</Td>
                <Td className="text-emerald-400">{fmt(item.paid)}</Td>
                <Td className="font-bold text-rose-400">{fmt(item.balance)}</Td>
                <Td>
                  <Link href={`/dashboard/rentals/${item.rental_id}`}>
                    <GhostBtn className="px-3 py-1.5 text-xs">Collect</GhostBtn>
                  </Link>
                </Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={7} className="text-center text-muted-foreground py-10">No pending payments</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
