"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Plus, RefreshCw, UserX, X } from "lucide-react";
import { Badge, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Customer = { id: number; name: string; email: string; phone: string; city: string; status: string; total_rentals: string; };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    fetch(`/api/customers?${params}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, status]);

  // Auto-refresh when page comes back into focus
  useEffect(() => {
    const handleFocus = () => load();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const hasFilters = search || status;

  return (
    <PageWrapper>
      <SectionHeader title="Customers" subtitle={`${customers.length} registered`}
        action={<div className="flex gap-2"><GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn><Link href="/dashboard/customers/new"><PrimaryBtn><Plus className="h-4 w-4" /> Add Customer</PrimaryBtn></Link></div>} />
      
      {/* Quick filters */}
      <div className="flex gap-2 mb-4">
        {[{ label: "All", val: "" }, { label: "Active", val: "active" }, { label: "Blacklisted", val: "blacklisted" }, { label: "Suspended", val: "suspended" }].map((t) => (
          <button key={t.val} onClick={() => setStatus(t.val)}
            className={`rounded-xl border px-4 py-1.5 text-xs transition ${status === t.val ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone..."
          className="rounded-xl border border-input bg-background px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 flex-1" />
        {hasFilters && <GhostBtn onClick={() => { setSearch(""); setStatus(""); }}>Clear</GhostBtn>}
      </div>

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {status && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setStatus("")}><X className="h-3 w-3" /></button>{status}</span>}
          {search && <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300 flex items-center gap-2"><button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>Search: {search}</span>}
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div> : (
        <Table>
          <thead><tr><Th>Customer</Th><Th>Phone</Th><Th>City</Th><Th>Rentals</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/3 transition">
                <Td><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-xs font-bold text-white flex-none">{c.name[0]}</div><div><p className="font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div></div></Td>
                <Td className="font-mono text-xs">{c.phone}</Td>
                <Td>{c.city}</Td>
                <Td className="font-semibold text-foreground">{c.total_rentals}</Td>
                <Td><Badge label={c.status} variant={c.status === "active" ? "success" : "danger"} /></Td>
                <Td><div className="flex gap-1.5"><Link href={`/dashboard/customers/${c.id}`}><GhostBtn className="px-2 py-1.5"><Eye className="h-3.5 w-3.5" /></GhostBtn></Link><GhostBtn className="px-2 py-1.5 text-rose-400"><UserX className="h-3.5 w-3.5" /></GhostBtn></div></Td>
              </tr>
            ))}
            {customers.length === 0 && <tr><Td colSpan={6} className="text-center text-muted-foreground py-10">No customers found</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
