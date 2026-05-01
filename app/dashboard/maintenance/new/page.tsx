"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";

type Car = { id: number; make: string; model: string; plate: string };

const SERVICE_TYPES = ["Oil Change", "Tyre Rotation", "Brake Inspection", "Engine Check", "Full Service", "Accident Repair", "Software Update", "Battery Check", "Air Filter", "General Service"];

export default function NewMaintenancePage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    car_id: "", type: "Oil Change", description: "", cost: "0",
    service_date: new Date().toISOString().split("T")[0],
    next_service_km: "", odometer: "", status: "scheduled", provider: "",
  });

  useEffect(() => {
    fetch("/api/cars").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then((d) => setCars(d.cars ?? []));
  }, []);

  function set(k: string) { return (v: string) => setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.car_id || !form.type || !form.service_date) { setError("Car, type and date are required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          car_id: parseInt(form.car_id),
          cost: parseFloat(form.cost),
          next_service_km: form.next_service_km ? parseInt(form.next_service_km) : null,
          odometer: form.odometer ? parseInt(form.odometer) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
      router.push("/dashboard/maintenance");
    } catch {
      setError("Network error"); setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/maintenance"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader title="Add Maintenance Record" subtitle="Log a service or repair" />
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-5">
          <Card>
            <h3 className="mb-5 font-semibold text-foreground">Service Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Vehicle <span className="text-rose-400">*</span></label>
                <select value={form.car_id} onChange={(e) => set("car_id")(e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                  <option value="">Select vehicle...</option>
                  {cars.map((c) => <option key={c.id} value={c.id}>{c.make} {c.model} - {c.plate}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Type <span className="text-rose-400">*</span></label>
                <select value={form.type} onChange={(e) => set("type")(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                  {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Date <span className="text-rose-400">*</span></label>
                <input type="date" value={form.service_date} onChange={(e) => set("service_date")(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost (AUD)</label>
                <input type="number" value={form.cost} onChange={(e) => set("cost")(e.target.value)} placeholder="180"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider / Workshop</label>
                <input type="text" value={form.provider} onChange={(e) => set("provider")(e.target.value)} placeholder="Sydney Auto Service"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Odometer (km)</label>
                <input type="number" value={form.odometer} onChange={(e) => set("odometer")(e.target.value)} placeholder="15000"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Service (km)</label>
                <input type="number" value={form.next_service_km} onChange={(e) => set("next_service_km")(e.target.value)} placeholder="20000"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={(e) => set("status")(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
                <textarea rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Describe the service..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 resize-none" />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <PrimaryBtn className="flex-1 justify-center" type="submit">
              {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</span> : "Save Record"}
            </PrimaryBtn>
            <Link href="/dashboard/maintenance" className="flex-1">
              <GhostBtn className="w-full justify-center">Cancel</GhostBtn>
            </Link>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
