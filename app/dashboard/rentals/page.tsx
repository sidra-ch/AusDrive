"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Plus, RefreshCw, X } from "lucide-react";
import { Badge, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Rental = { id: number; customer_name: string; make: string; model: string; plate: string; start_date: string; expected_return: string; total_amount: string; status: string; balance: string; };

function fmt(n: string | number) { return `$${parseFloat(String(n)).toFixed(0)}`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-AU"); }
function statusVariant(s: string): "success" | "danger" | "warning" | "info" | "neutral" {
  if (s === "active") return "success"; if (s === "overdue") return "danger";
  if (s === "completed") return "neutral"; return "info";
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    fetch(`/api/rentals?${params}`).then((r) => r.json()).then((d) => { setRentals(d.rentals ?? []); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status, search, fromDate, toDate]);

  const hasFilters = status || search || fromDate || toDate;

  return (
    <PageWrapper>
      <SectionHeader title="Rentals" subtitle={`${rentals.length} records`}
        action={<div className="flex gap-2"><GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn><Link href="/dashboard/bookings/new"><PrimaryBtn><Plus className="h-4 w-4" /> New Rental</PrimaryBtn></Link></div>} />
      
      {/* Quick filters */}
      <div className="flex gap-2 border-b border-border pb-4 mb-4">
        {[{ label: "All", val: "" }, { label: "Active", val: "active" }, { label: "Overdue", val: "overdue" }, { label: "Completed", val: "completed" }].map((t) => (
          <button key={t.val} onClick={() => setStatus(t.val)}
            className={`rounded-xl border px-4 py-1.5 text-xs transition ${status === t.val ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
        <GhostBtn onClick={() => setShowFilters(!showFilters)} className="ml-auto">Advanced</GhostBtn>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase">Search Customer/Car</label>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or plate..." className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500/40" />
            </div>
            <div className="flex items-end gap-2">
              <GhostBtn onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }} className="w-full justify-center">
                <X className="h-4 w-4" /> Clear
              </GhostBtn>
            </div>
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {status && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setStatus("")}><X className="h-3 w-3" /></button>{status}</span>}
          {search && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>Search: {search}</span>}
          {fromDate && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setFromDate("")}><X className="h-3 w-3" /></button>From: {fromDate}</span>}
          {toDate && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setToDate("")}><X className="h-3 w-3" /></button>To: {toDate}</span>}
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Due</Th><Th>Total</Th><Th>Balance</Th><Th>Status</Th><Th> </Th></tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><div className="h-4 w-12 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-40 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 rounded bg-muted" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-8 rounded bg-muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Table>
          <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Due</Th><Th>Total</Th><Th>Balance</Th><Th>Status</Th><Th> </Th></tr></thead>
          <tbody>
            {rentals.map((r, i) => (
              <tr key={r.id} className="hover:bg-muted/50 transition-all duration-200 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 30}ms` }}>
                <Td><span className="font-mono text-cyan-400">#{r.id}</span></Td>
                <Td>{r.customer_name}</Td>
                <Td className="text-muted-foreground">{r.make} {r.model} <span className="font-mono text-xs text-muted-foreground/50">{r.plate}</span></Td>
                <Td>{fmtDate(r.start_date)}</Td>
                <Td>{fmtDate(r.expected_return)}</Td>
                <Td className="font-semibold text-foreground">{fmt(r.total_amount)}</Td>
                <Td className={parseFloat(r.balance) > 0 ? "text-rose-400 font-semibold" : "text-emerald-400"}>{fmt(r.balance)}</Td>
                <Td><Badge label={r.status} variant={statusVariant(r.status)} /></Td>
                <Td><Link href={`/dashboard/rentals/${r.id}`}><GhostBtn className="px-2 py-1.5"><Eye className="h-3.5 w-3.5" /></GhostBtn></Link></Td>
              </tr>
            ))}
            {rentals.length === 0 && <tr><Td colSpan={9} className="text-center text-muted-foreground py-10">No rentals found</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
