"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";
import { CheckCircle } from "lucide-react";

type Settings = Record<string, string>;

function Field({ label, skey, type = "text", settings, set }: {
  label: string; skey: string; type?: string;
  settings: Settings; set: (k: string, v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <input type={type} value={settings[skey] ?? ""} onChange={(e) => set(skey, e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
    </div>
  );
}

function Toggle({ label, desc, skey, settings, set }: {
  label: string; desc: string; skey: string;
  settings: Settings; set: (k: string, v: string) => void;
}) {
  const enabled = settings[skey] === "true";
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5" onClick={() => set(skey, enabled ? "false" : "true")}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/80">{desc}</p>
      </div>
      <div className={`h-6 w-11 rounded-full cursor-pointer transition ${enabled ? "bg-cyan-500" : "bg-white/15"}`}>
        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${enabled ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings ?? {});
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save(section: string, keys: string[]) {
    setSaving(section);
    const payload: Settings = {};
    for (const k of keys) payload[k] = settings[k] ?? "";
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(null);
    if (res.ok) { setSaved(section); setTimeout(() => setSaved(null), 2500); }
  }

  if (loading) return <PageWrapper><div className="py-24 text-center text-muted-foreground">Loading settings...</div></PageWrapper>;

  const pricingKeys = ["base_daily_rate", "weekend_surcharge_pct", "late_fee_per_day", "security_deposit", "young_driver_surcharge"];
  const branchKeys = ["branch_name", "branch_address", "branch_phone", "branch_email"];
  const toggleKeys = ["gps_tracking_enabled", "stripe_payments_enabled", "email_notifications_enabled", "sms_notifications_enabled", "auto_overdue_check_enabled"];

  return (
    <PageWrapper>
      <SectionHeader title="Settings" subtitle="Platform configuration" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-5 font-semibold text-foreground">Pricing Rules</h3>
          <div className="space-y-4">
            <Field label="Base Daily Rate (AUD)" skey="base_daily_rate" type="number" settings={settings} set={set} />
            <Field label="Weekend Surcharge (%)" skey="weekend_surcharge_pct" type="number" settings={settings} set={set} />
            <Field label="Late Fee per Day (AUD)" skey="late_fee_per_day" type="number" settings={settings} set={set} />
            <Field label="Security Deposit (AUD)" skey="security_deposit" type="number" settings={settings} set={set} />
            <Field label="Young Driver Surcharge (AUD)" skey="young_driver_surcharge" type="number" settings={settings} set={set} />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <PrimaryBtn onClick={() => save("pricing", pricingKeys)} disabled={saving === "pricing"}>
              {saving === "pricing" ? "Saving..." : "Save Pricing"}
            </PrimaryBtn>
            {saved === "pricing" && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle className="h-4 w-4" /> Saved</span>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-5 font-semibold text-foreground">Branch Management</h3>
          <div className="space-y-4">
            <Field label="Branch Name" skey="branch_name" settings={settings} set={set} />
            <Field label="Address" skey="branch_address" settings={settings} set={set} />
            <Field label="Phone" skey="branch_phone" settings={settings} set={set} />
            <Field label="Email" skey="branch_email" settings={settings} set={set} />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <PrimaryBtn onClick={() => save("branch", branchKeys)} disabled={saving === "branch"}>
              {saving === "branch" ? "Saving..." : "Save Branch"}
            </PrimaryBtn>
            {saved === "branch" && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle className="h-4 w-4" /> Saved</span>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-5 font-semibold text-foreground">Payment Gateway</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Stripe Publishable Key</label>
              <input type="text" placeholder="pk_live_... (set in .env.local)" disabled
                className="w-full rounded-xl border border-white/8 bg-white/2 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Stripe Secret Key</label>
              <input type="password" placeholder="sk_live_... (set in .env.local)" disabled
                className="w-full rounded-xl border border-white/8 bg-white/2 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <p className="text-xs text-muted-foreground">API keys must be set as environment variables in <code className="text-cyan-400">.env.local</code> for security. They cannot be edited here.</p>
          </div>
        </Card>

        <Card>
          <h3 className="mb-5 font-semibold text-foreground">Notification Config</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">SendGrid API Key</label>
              <input type="password" placeholder="SG.... (set in .env.local)" disabled
                className="w-full rounded-xl border border-white/8 bg-white/2 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Twilio Account SID</label>
              <input type="password" placeholder="AC... (set in .env.local)" disabled
                className="w-full rounded-xl border border-white/8 bg-white/2 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <p className="text-xs text-muted-foreground">API keys must be set in <code className="text-cyan-400">.env.local</code>.</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-5 font-semibold text-foreground">Feature Toggles</h3>
          <Toggle label="GPS Tracking" desc="Enable real-time vehicle tracking" skey="gps_tracking_enabled" settings={settings} set={set} />
          <Toggle label="Stripe Payments" desc="Accept online card payments" skey="stripe_payments_enabled" settings={settings} set={set} />
          <Toggle label="Email Notifications" desc="Send notifications via SendGrid" skey="email_notifications_enabled" settings={settings} set={set} />
          <Toggle label="SMS Notifications" desc="Send SMS alerts via Twilio" skey="sms_notifications_enabled" settings={settings} set={set} />
          <Toggle label="Auto Overdue Detection" desc="Mark rentals overdue automatically" skey="auto_overdue_check_enabled" settings={settings} set={set} />
          <div className="mt-4 flex items-center gap-3">
            <PrimaryBtn onClick={() => save("toggles", toggleKeys)} disabled={saving === "toggles"}>
              {saving === "toggles" ? "Saving..." : "Save Toggles"}
            </PrimaryBtn>
            {saved === "toggles" && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle className="h-4 w-4" /> Saved</span>}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}


