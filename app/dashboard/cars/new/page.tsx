"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";
import { ImageUpload } from "@/components/dashboard/image-upload";

function Field({ label, name, type = "text", placeholder, value, onChange, required }: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input type={type} name={name} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition" />
    </div>
  );
}

function Select({ label, name, options, value, onChange, required }: {
  label: string; name: string; options: string[]; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 transition">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const CATEGORIES = ["Economy", "SUV", "Luxury", "People Mover", "Convertible", "Ute"];
const TRANSMISSIONS = ["Automatic", "Manual"];
const FUELS = ["Petrol", "Diesel", "Electric", "Hybrid"];

export default function NewCarPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<Record<string, { id: number; area: string }[]>>({});
  const [areas, setAreas] = useState<string[]>([]);
  const [form, setForm] = useState({
    make: "", model: "", year: new Date().getFullYear().toString(),
    plate: "", vin: "", colour: "", category: "Economy",
    transmission: "Automatic", fuel_type: "Petrol",
    seats: "5", bags: "2", odometer: "0",
    daily_rate: "", weekend_rate: "", late_fee: "25", deposit: "500",
    branch: "Sydney", city: "", area: "", image_url: "", gps_imei: "",
    insurance_policy: "", insurance_provider: "", insurance_expiry: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/locations")
      .then(r => r.json())
      .then(data => setLocations(data.grouped || {}))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.city && locations[form.city]) {
      setAreas(locations[form.city].map((l: { area: string }) => l.area));
    } else {
      setAreas([]);
      setForm(f => ({ ...f, area: "" }));
    }
  }, [form.city, locations]);

  function set(k: string) { return (v: string) => setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.make || !form.model || !form.plate || !form.daily_rate) {
      setError("Make, model, plate and daily rate are required."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          year: parseInt(form.year), 
          seats: parseInt(form.seats), 
          bags: parseInt(form.bags), 
          odometer: parseInt(form.odometer), 
          daily_rate: parseFloat(form.daily_rate), 
          weekend_rate: form.weekend_rate ? parseFloat(form.weekend_rate) : null, 
          late_fee: parseFloat(form.late_fee), 
          deposit: parseFloat(form.deposit) 
        }),
      });
      const raw = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) as { error?: string } : null;
      } catch {
        data = null;
      }
      if (!res.ok) { setError(data?.error ?? "Failed to save"); setSaving(false); return; }
      // Redirect to cars list instead of detail page to show the new car
      router.push("/dashboard/cars");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Network error"); setSaving(false);
    }
  }

  const cities = Object.keys(locations);

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/cars"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader title="Add New Car" subtitle="Register a vehicle to the fleet" />
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Vehicle Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Make" name="make" placeholder="BMW" value={form.make} onChange={set("make")} required />
                <Field label="Model" name="model" placeholder="5 Series" value={form.model} onChange={set("model")} required />
                <Field label="Year" name="year" type="number" placeholder="2024" value={form.year} onChange={set("year")} required />
                <Field label="Registration Plate" name="plate" placeholder="NSW-1234" value={form.plate} onChange={set("plate")} required />
                <Field label="VIN" name="vin" placeholder="1HGBH41JXMN109186" value={form.vin} onChange={set("vin")} />
                <Field label="Colour" name="colour" placeholder="Midnight Black" value={form.colour} onChange={set("colour")} />
                <Field label="Odometer (km)" name="odometer" type="number" placeholder="0" value={form.odometer} onChange={set("odometer")} />
                <Select label="Category" name="category" options={CATEGORIES} value={form.category} onChange={set("category")} />
                <Select label="Transmission" name="transmission" options={TRANSMISSIONS} value={form.transmission} onChange={set("transmission")} />
                <Select label="Fuel Type" name="fuel_type" options={FUELS} value={form.fuel_type} onChange={set("fuel_type")} />
                <Field label="Seats" name="seats" type="number" placeholder="5" value={form.seats} onChange={set("seats")} />
                <Field label="Bags" name="bags" type="number" placeholder="2" value={form.bags} onChange={set("bags")} />
              </div>
            </Card>

            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Pricing</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Daily Rate (AUD)" name="daily_rate" type="number" placeholder="89" value={form.daily_rate} onChange={set("daily_rate")} required />
                <Field label="Weekend Rate (AUD)" name="weekend_rate" type="number" placeholder="99" value={form.weekend_rate} onChange={set("weekend_rate")} />
                <Field label="Late Fee / Day (AUD)" name="late_fee" type="number" placeholder="25" value={form.late_fee} onChange={set("late_fee")} />
                <Field label="Security Deposit (AUD)" name="deposit" type="number" placeholder="500" value={form.deposit} onChange={set("deposit")} />
              </div>
            </Card>

            <Card>
              <h3 className="mb-5 font-semibold text-foreground">GPS Device</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Device IMEI" name="gps_imei" placeholder="864977040123456" value={form.gps_imei} onChange={set("gps_imei")} />
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Car Image</h3>
              <ImageUpload 
                value={form.image_url} 
                onChange={set("image_url")}
                onRemove={() => set("image_url")("")}
              />
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Location</h3>
              <div className="space-y-4">
                <Select label="City" name="city" options={cities} value={form.city} onChange={set("city")} />
                {form.city && areas.length > 0 && (
                  <Select label="Area / Suburb" name="area" options={areas} value={form.area} onChange={set("area")} />
                )}
                <Field label="Branch Name" name="branch" placeholder="Sydney HQ" value={form.branch} onChange={set("branch")} />
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Insurance</h3>
              <div className="space-y-4">
                <Field label="Policy Number" name="insurance_policy" placeholder="POL-2024-001" value={form.insurance_policy} onChange={set("insurance_policy")} />
                <Field label="Provider" name="insurance_provider" placeholder="NRMA Insurance" value={form.insurance_provider} onChange={set("insurance_provider")} />
                <Field label="Expiry Date" name="insurance_expiry" type="date" value={form.insurance_expiry} onChange={set("insurance_expiry")} />
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Notes</h3>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)}
                placeholder="Any additional notes..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 resize-none" />
            </Card>

            <div className="flex gap-3">
              <PrimaryBtn className="flex-1 justify-center" type="submit">
                {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</span> : "Save Car"}
              </PrimaryBtn>
              <Link href="/dashboard/cars" className="flex-1">
                <GhostBtn className="w-full justify-center">Cancel</GhostBtn>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
