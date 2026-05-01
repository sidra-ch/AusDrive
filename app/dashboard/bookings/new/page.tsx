"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLoader } from "@/components/dashboard/loading";
import { Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";

type Car = { id: number; make: string; model: string; plate: string; daily_rate: string; category: string; status: string };
type Customer = { id: number; name: string; email: string };

function NewRentalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    car_id: searchParams.get("car_id") ?? "",
    customer_id: searchParams.get("customer_id") ?? "",
    start_date: "", expected_return: "",
    daily_rate: "", deposit: "500", discount: "0", late_fee_per_day: "25",
    odometer_out: "", fuel_out: "100",
  });

  useEffect(() => {
    fetch("/api/cars?status=available").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then((d) => setCars(d.cars ?? []));
    fetch("/api/customers").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then((d) => setCustomers(d.customers ?? []));
  }, []);

  // Auto-fill daily rate when car selected
  useEffect(() => {
    if (form.car_id) {
      const car = cars.find((c) => String(c.id) === form.car_id);
      if (car) setForm((f) => ({ ...f, daily_rate: parseFloat(car.daily_rate).toFixed(0) }));
    }
  }, [form.car_id, cars]);

  function set(k: string) { return (v: string) => setForm((f) => ({ ...f, [k]: v })); }

  // Calculate totals
  const days = form.start_date && form.expected_return
    ? Math.max(1, Math.ceil((new Date(form.expected_return).getTime() - new Date(form.start_date).getTime()) / 86400000))
    : 0;
  const subtotal = days * parseFloat(form.daily_rate || "0");
  const total = subtotal - parseFloat(form.discount || "0") + parseFloat(form.deposit || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.car_id || !form.customer_id || !form.start_date || !form.expected_return || !form.daily_rate) {
      setError("All required fields must be filled."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: parseInt(form.car_id),
          customer_id: parseInt(form.customer_id),
          start_date: form.start_date,
          expected_return: form.expected_return,
          daily_rate: parseFloat(form.daily_rate),
          deposit: parseFloat(form.deposit),
          discount: parseFloat(form.discount),
          late_fee_per_day: parseFloat(form.late_fee_per_day),
          odometer_out: form.odometer_out ? parseInt(form.odometer_out) : null,
          fuel_out: parseInt(form.fuel_out),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create rental"); setSaving(false); return; }
      router.push(`/dashboard/rentals/${data.rental.id}`);
    } catch {
      setError("Network error"); setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/rentals"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader title="New Rental" subtitle="Create a vehicle rental" />
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Car selection */}
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Select Vehicle <span className="text-rose-400">*</span></h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {cars.map((car) => (
                  <button key={car.id} type="button" onClick={() => set("car_id")(String(car.id))}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${String(form.car_id) === String(car.id) ? "border-cyan-500/40 bg-cyan-500/8" : "border-white/8 bg-white/3 hover:border-white/20"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg flex-none">C</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{car.make} {car.model}</p>
                      <p className="text-xs text-muted-foreground">{car.plate} - ${parseFloat(car.daily_rate).toFixed(0)}/day</p>
                    </div>
                    {String(form.car_id) === String(car.id) && <div className="ml-auto h-2 w-2 rounded-full bg-cyan-400 flex-none" />}
                  </button>
                ))}
                {cars.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No available cars</p>}
              </div>
            </Card>

            {/* Customer selection */}
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Select Customer <span className="text-rose-400">*</span></h3>
              <select value={form.customer_id} onChange={(e) => set("customer_id")(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.email}</option>)}
              </select>
            </Card>

            {/* Dates */}
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Rental Dates</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date & Time <span className="text-rose-400">*</span></label>
                  <input type="datetime-local" value={form.start_date} onChange={(e) => set("start_date")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Expected Return <span className="text-rose-400">*</span></label>
                  <input type="datetime-local" value={form.expected_return} onChange={(e) => set("expected_return")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Odometer Out (km)</label>
                  <input type="number" value={form.odometer_out} onChange={(e) => set("odometer_out")(e.target.value)} placeholder="15000"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Fuel Level Out (%)</label>
                  <input type="number" min="0" max="100" value={form.fuel_out} onChange={(e) => set("fuel_out")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Pricing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Daily Rate (AUD)", key: "daily_rate", placeholder: "89" },
                  { label: "Security Deposit (AUD)", key: "deposit", placeholder: "500" },
                  { label: "Discount (AUD)", key: "discount", placeholder: "0" },
                  { label: "Late Fee / Day (AUD)", key: "late_fee_per_day", placeholder: "25" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
                    <input type="number" value={form[key as keyof typeof form]} onChange={(e) => set(key)(e.target.value)} placeholder={placeholder}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-5">
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Rental Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Car", form.car_id ? `${cars.find((c) => String(c.id) === form.car_id)?.make ?? ""} ${cars.find((c) => String(c.id) === form.car_id)?.model ?? ""}` : "-"],
                  ["Customer", form.customer_id ? customers.find((c) => String(c.id) === form.customer_id)?.name ?? "-" : "-"],
                  ["Days", days || "-"],
                  ["Daily Rate", form.daily_rate ? `$${form.daily_rate}` : "-"],
                  ["Subtotal", days ? `$${subtotal.toFixed(0)}` : "-"],
                  ["Discount", `-$${form.discount || "0"}`],
                  ["Deposit", `$${form.deposit || "0"}`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{String(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-foreground">Total Payable</span>
                  <span className="text-lg font-bold text-cyan-400">{days ? `$${total.toFixed(0)}` : "-"}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <PrimaryBtn className="flex-1 justify-center" type="submit">
                {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating...</span> : "Confirm Rental"}
              </PrimaryBtn>
              <Link href="/dashboard/rentals" className="flex-1">
                <GhostBtn className="w-full justify-center">Cancel</GhostBtn>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}

export default function NewRentalPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NewRentalPageContent />
    </Suspense>
  );
}
