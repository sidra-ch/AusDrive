"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";

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
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition" />
    </div>
  );
}

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const CITIES = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Darwin"];

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "", address: "", postcode: "",
    dob: "", licence_number: "", licence_state: "NSW",
    licence_expiry: "", licence_class: "C", notes: "",
  });

  function set(k: string) { return (v: string) => setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
      router.push("/dashboard/customers");
    } catch {
      setError("Network error"); setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/customers"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader title="Add New Customer" subtitle="Register a customer account" />
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Personal Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" name="name" placeholder="James Thornton" value={form.name} onChange={set("name")} required />
                <Field label="Email" name="email" type="email" placeholder="james@example.com" value={form.email} onChange={set("email")} required />
                <Field label="Phone" name="phone" placeholder="+61 412 345 678" value={form.phone} onChange={set("phone")} />
                <Field label="Date of Birth" name="dob" type="date" value={form.dob} onChange={set("dob")} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">City</label>
                  <select value={form.city} onChange={(e) => set("city")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                    <option value="">Select city...</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Postcode" name="postcode" placeholder="2000" value={form.postcode} onChange={set("postcode")} />
                <div className="sm:col-span-2">
                  <Field label="Address" name="address" placeholder="123 George St, Sydney" value={form.address} onChange={set("address")} />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-5 font-semibold text-foreground">Driver&apos;s Licence</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Licence Number" name="licence_number" placeholder="NSW-12345678" value={form.licence_number} onChange={set("licence_number")} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">State</label>
                  <select value={form.licence_state} onChange={(e) => set("licence_state")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="Expiry Date" name="licence_expiry" type="date" value={form.licence_expiry} onChange={set("licence_expiry")} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Class</label>
                  <select value={form.licence_class} onChange={(e) => set("licence_class")(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                    {["C", "R", "LR", "MR", "HR", "HC", "MC"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Notes</h3>
              <textarea rows={4} value={form.notes} onChange={(e) => set("notes")(e.target.value)}
                placeholder="Any additional notes..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 resize-none" />
            </Card>
            <div className="flex gap-3">
              <PrimaryBtn className="flex-1 justify-center" type="submit">
                {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</span> : "Save Customer"}
              </PrimaryBtn>
              <Link href="/dashboard/customers" className="flex-1">
                <GhostBtn className="w-full justify-center">Cancel</GhostBtn>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
