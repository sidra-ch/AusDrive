"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, RotateCcw } from "lucide-react";
import { Badge, Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Rental = Record<string, unknown>;
type Payment = Record<string, unknown>;

function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }
function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }
function statusVariant(s: string): "success" | "danger" | "warning" | "info" | "neutral" {
  if (s === "active") return "success"; if (s === "overdue") return "danger";
  if (s === "completed") return "neutral"; return "info";
}

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [rental, setRental] = useState<Rental | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturn, setShowReturn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [returnForm, setReturnForm] = useState({ odometer_in: "", fuel_in: "100", damage_notes: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "Cash" });
  const [processing, setProcessing] = useState(false);

  function load(pid: string) {
    fetch(`/api/rentals/${pid}`)
      .then((r) => r.json())
      .then((d) => { setRental(d.rental); setPayments(d.payments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { params.then(({ id: pid }) => { setId(pid); load(pid); }); }, [params]);

  async function processReturn() {
    setProcessing(true);
    const res = await fetch(`/api/rentals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", ...returnForm, odometer_in: returnForm.odometer_in ? parseInt(returnForm.odometer_in) : null, fuel_in: parseInt(returnForm.fuel_in) }),
    });
    if (res.ok) { setShowReturn(false); load(id); }
    setProcessing(false);
  }

  async function recordPayment() {
    setProcessing(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rental_id: parseInt(id), customer_id: rental?.customer_id, amount: parseFloat(paymentForm.amount), method: paymentForm.method }),
    });
    if (res.ok) { setShowPayment(false); setPaymentForm({ amount: "", method: "Cash" }); load(id); }
    setProcessing(false);
  }

  if (loading) return <PageWrapper><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div></PageWrapper>;
  if (!rental) return <PageWrapper><p className="text-muted-foreground">Rental not found.</p></PageWrapper>;

  const balance = parseFloat(String(rental.balance ?? 0));
  const paidAmount = parseFloat(String(rental.paid_amount ?? 0));

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/rentals"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader
          title={`Rental #${id}`}
          subtitle={`${String(rental.customer_name ?? "")} - ${String(rental.make ?? "")} ${String(rental.model ?? "")}`}
          action={
            <div className="flex gap-2">
              {rental.status === "active" || rental.status === "overdue" ? (
                <PrimaryBtn onClick={() => setShowReturn(true)}><RotateCcw className="h-4 w-4" /> Process Return</PrimaryBtn>
              ) : null}
              <GhostBtn onClick={() => setShowPayment(true)}><FileText className="h-4 w-4" /> Record Payment</GhostBtn>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Rental breakdown */}
          <Card>
            <h3 className="mb-5 font-semibold text-foreground">Rental Breakdown</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["Customer", rental.customer_name], ["Phone", rental.customer_phone ?? "-"],
                ["Vehicle", `${rental.make} ${rental.model}`], ["Plate", rental.plate],
                ["Start Date", fmtDate(rental.start_date)], ["Expected Return", fmtDate(rental.expected_return)],
                ["Actual Return", fmtDate(rental.actual_return)], ["Daily Rate", fmt(rental.daily_rate)],
                ["Deposit", fmt(rental.deposit)], ["Discount", fmt(rental.discount)],
                ["Late Days", String(rental.late_days ?? 0)], ["Total Payable", fmt(rental.total_amount)],
              ] as [string, unknown][]).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{k}</span>
                  <span className="text-sm font-semibold text-foreground">{String(v ?? "-")}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payments */}
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
                    <Td><Badge label={String(p.status)} variant="success" /></Td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><Td colSpan={5} className="text-center text-muted-foreground py-6">No payments recorded</Td></tr>}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Status</h3>
            <Badge label={String(rental.status)} variant={statusVariant(String(rental.status))} />
              <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-foreground">{fmt(rental.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-bold text-emerald-400">{fmt(paidAmount)}</span></div>
              <div className="flex justify-between border-t border-white/8 pt-3"><span className="font-semibold text-foreground">Balance Due</span><span className={`text-lg font-bold ${balance > 0 ? "text-rose-400" : "text-emerald-400"}`}>{fmt(balance)}</span></div>
            </div>
          </Card>

          {rental.damage_notes ? (
            <Card>
              <h3 className="mb-3 font-semibold text-foreground">Damage Report</h3>
              <p className="text-sm text-muted-foreground">{String(rental.damage_notes)}</p>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Return Modal */}
      {showReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-background p-6 shadow-2xl">
            <h3 className="mb-5 text-lg font-bold text-foreground">Process Return</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Odometer In (km)</label>
                <input type="number" value={returnForm.odometer_in} onChange={(e) => setReturnForm((f) => ({ ...f, odometer_in: e.target.value }))} placeholder="16500"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Fuel Level In (%)</label>
                <input type="number" min="0" max="100" value={returnForm.fuel_in} onChange={(e) => setReturnForm((f) => ({ ...f, fuel_in: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Damage Notes</label>
                <textarea rows={3} value={returnForm.damage_notes} onChange={(e) => setReturnForm((f) => ({ ...f, damage_notes: e.target.value }))} placeholder="Any damage observed..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 resize-none" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <PrimaryBtn className="flex-1 justify-center" onClick={processReturn}>
                {processing ? "Processing..." : "Confirm Return"}
              </PrimaryBtn>
              <GhostBtn className="flex-1 justify-center" onClick={() => setShowReturn(false)}>Cancel</GhostBtn>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-background p-6 shadow-2xl">
            <h3 className="mb-5 text-lg font-bold text-foreground">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount (AUD)</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} placeholder={String(balance.toFixed(0))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Method</label>
                <select value={paymentForm.method} onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                  {["Cash", "Stripe", "Bank Transfer", "EFTPOS"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <PrimaryBtn className="flex-1 justify-center" onClick={recordPayment}>
                {processing ? "Saving..." : "Record Payment"}
              </PrimaryBtn>
              <GhostBtn className="flex-1 justify-center" onClick={() => setShowPayment(false)}>Cancel</GhostBtn>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
