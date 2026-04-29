"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Badge, GhostBtn, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Payment = Record<string, unknown>;

function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }
function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }
function statusVariant(s: string): "success" | "warning" | "danger" {
  return s === "paid" ? "success" : s === "partial" ? "warning" : "danger";
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    fetch(`/api/payments?${params}`)
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  const filtered = methodFilter ? payments.filter((p) => String(p.method) === methodFilter) : payments;
  const totalCollected = payments.reduce((s, p) => s + parseFloat(String(p.amount ?? 0)), 0);
  const totalCount = payments.length;

  return (
    <PageWrapper>
      <SectionHeader
        title="Payments"
        subtitle={`${totalCount} records`}
        action={<GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn>}
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Collected", value: fmt(totalCollected), color: "text-emerald-400" },
          { label: "Total Records", value: String(totalCount), color: "text-cyan-400" },
          { label: "This Month", value: fmt(payments.filter((p) => new Date(String(p.created_at)).getMonth() === new Date().getMonth()).reduce((s, p) => s + parseFloat(String(p.amount ?? 0)), 0)), color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-input bg-background p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "paid", "partial", "refunded"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-4 py-1.5 text-xs transition ${filter === f ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground"}`}>
            {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto">
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-4 py-1.5 text-xs text-muted-foreground outline-none focus:border-cyan-500/40">
            <option value="">All Methods</option>
            {["Cash", "Stripe", "Bank Transfer", "EFTPOS"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div>
      ) : (
        <Table>
          <thead>
            <tr><Th>ID</Th><Th>Rental</Th><Th>Customer</Th><Th>Amount</Th><Th>Method</Th><Th>Date</Th><Th>Status</Th><Th>Receipt</Th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={String(p.id)} className="hover:bg-white/3 transition">
                <Td><span className="font-mono text-cyan-400">#{String(p.id)}</span></Td>
                <Td><span className="font-mono text-muted-foreground">#{String(p.rental_id ?? "-")}</span></Td>
                <Td>{String(p.customer_name ?? "-")}</Td>
                <Td className="font-bold text-foreground">{fmt(p.amount)}</Td>
                <Td>{String(p.method ?? "-")}</Td>
                <Td>{fmtDate(p.created_at)}</Td>
                <Td><Badge label={String(p.status ?? "paid")} variant={statusVariant(String(p.status ?? "paid"))} /></Td>
                <Td>
                  <GhostBtn className="px-2 py-1.5" onClick={() => {
                    const rows = [[`Payment #${p.id}`, `Rental #${p.rental_id}`, p.customer_name, p.amount, p.method, p.created_at].join(",")];
                    const blob = new Blob([["ID,Rental,Customer,Amount,Method,Date", ...rows].join("\n")], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `payment-${p.id}.csv`; a.click();
                  }}>
                    <Download className="h-3.5 w-3.5" />
                  </GhostBtn>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><Td colSpan={8} className="text-center text-muted-foreground py-10">No payments found</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
