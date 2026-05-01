"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Customer = Record<string, unknown>;
type Rental = Record<string, unknown>;
type Payment = Record<string, unknown>;

function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }
function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      fetch(`/api/customers/${pid}`)
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((d) => { setCustomer(d.customer); setRentals(d.rentals ?? []); setPayments(d.payments ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [params]);

  async function toggleBlacklist() {
    const newStatus = customer?.status === "blacklisted" ? "active" : "blacklisted";
    await fetch(`/api/customers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setCustomer((c) => c ? { ...c, status: newStatus } : c);
  }

  if (loading) return <PageWrapper><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div></PageWrapper>;
  if (!customer) return <PageWrapper><p className="text-muted-foreground">Customer not found.</p></PageWrapper>;

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/customers"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader
          title={String(customer.name)}
          subtitle={`${String(customer.city ?? "")} - Joined ${fmtDate(customer.created_at)}`}
          action={
            <div className="flex gap-2">
              <Link href={`/dashboard/bookings/new?customer_id=${id}`}><PrimaryBtn>New Rental</PrimaryBtn></Link>
              <GhostBtn onClick={toggleBlacklist} className={customer.status === "blacklisted" ? "text-emerald-400" : "text-rose-400"}>
                {customer.status === "blacklisted" ? "Remove Blacklist" : "Blacklist"}
              </GhostBtn>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Rental History</h3>
            <Table>
              <thead><tr><Th>ID</Th><Th>Car</Th><Th>Start</Th><Th>Return</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={String(r.id)} className="hover:bg-white/3 transition">
                    <Td><Link href={`/dashboard/rentals/${r.id}`}><span className="font-mono text-cyan-400">#{String(r.id)}</span></Link></Td>
                    <Td>{String(r.make ?? "")} {String(r.model ?? "")}</Td>
                    <Td>{fmtDate(r.start_date)}</Td>
                    <Td>{fmtDate(r.expected_return)}</Td>
                    <Td className="font-semibold text-foreground">{fmt(r.total_amount)}</Td>
                    <Td><Badge label={String(r.status)} variant={r.status === "active" ? "success" : r.status === "overdue" ? "danger" : "neutral"} /></Td>
                  </tr>
                ))}
                {rentals.length === 0 && <tr><Td colSpan={6} className="text-center text-muted-foreground py-6">No rentals yet</Td></tr>}
              </tbody>
            </Table>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Payment History</h3>
            <Table>
              <thead><tr><Th>ID</Th><Th>Amount</Th><Th>Method</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={String(p.id)} className="hover:bg-white/3 transition">
                    <Td><span className="font-mono text-cyan-400">#{String(p.id)}</span></Td>
                    <Td className="font-semibold text-foreground">{fmt(p.amount)}</Td>
                    <Td>{String(p.method ?? "-")}</Td>
                    <Td>{fmtDate(p.created_at)}</Td>
                    <Td><Badge label={String(p.status)} variant={p.status === "paid" ? "success" : "warning"} /></Td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><Td colSpan={5} className="text-center text-muted-foreground py-6">No payments yet</Td></tr>}
              </tbody>
            </Table>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-xl font-bold text-white flex-none">
                {String(customer.name)[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">{String(customer.name)}</p>
                <Badge label={String(customer.status)} variant={customer.status === "active" ? "success" : "danger"} />
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {([
                ["Email", customer.email],
                ["Phone", customer.phone ?? "-"],
                ["City", customer.city ?? "-"],
                ["Address", customer.address ?? "-"],
                ["Date of Birth", fmtDate(customer.dob)],
              ] as [string, unknown][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground flex-none">{k}</dt>
                  <dd className="font-medium text-foreground text-right truncate">{String(v ?? "-")}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Driver&apos;s Licence</h3>
            <dl className="space-y-3 text-sm">
              {([
                ["Number", customer.licence_number ?? "-"],
                ["State", customer.licence_state ?? "-"],
                ["Class", customer.licence_class ?? "-"],
                ["Expires", fmtDate(customer.licence_expiry)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
