"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge, Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";
import { CheckCheck, Plus } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon: Record<string, string> = { overdue: "!", payment: "$", maintenance: "M", booking: "B", gps: "G", system: "*" };
const typeVariant: Record<string, "danger" | "warning" | "info" | "success" | "neutral"> = {
  overdue: "danger", payment: "warning", maintenance: "warning", booking: "info", gps: "info", system: "neutral",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(id: number) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    await Promise.all(
      notifications.filter((n) => !n.is_read).map((n) => markRead(n.id))
    );
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <PageWrapper>
      <SectionHeader
        title="Notifications"
        subtitle="System alerts & messages"
        action={
          <div className="flex gap-2">
            <GhostBtn onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Mark All Read</GhostBtn>
            <PrimaryBtn><Plus className="h-4 w-4" /> Create Template</PrimaryBtn>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-foreground">Recent Alerts</h3>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No notifications</div>
          ) : notifications.map((n) => (
            <div key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex gap-4 rounded-2xl border p-4 transition cursor-pointer ${n.is_read ? "border-white/8 bg-white/3" : "border-cyan-500/20 bg-cyan-500/6"}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-foreground flex-none">
                {typeIcon[n.type] ?? "*"}
              </div>
              <div className="flex-1">
                {n.title && <p className={`text-sm font-medium ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>}
                <p className={`text-sm ${n.is_read ? "text-muted-foreground" : "text-foreground/80"}`}>{n.message}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge label={n.type} variant={typeVariant[n.type] ?? "neutral"} />
                  <span className="text-xs text-muted-foreground/70">
                    {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                  </span>
                </div>
              </div>
              {!n.is_read && <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1.5 flex-none" />}
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Notification Channels</h3>
            <div className="space-y-3">
              {[
                { label: "Email (SendGrid)", enabled: !!process.env.NEXT_PUBLIC_HAS_SENDGRID },
                { label: "SMS (Twilio)", enabled: !!process.env.NEXT_PUBLIC_HAS_TWILIO_SMS },
                { label: "Push (Firebase)", enabled: false },
                { label: "WhatsApp", enabled: !!process.env.NEXT_PUBLIC_HAS_TWILIO_WHATSAPP },
              ].map((ch) => (
                <div key={ch.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{ch.label}</span>
                  <div className={`h-5 w-9 rounded-full transition ${ch.enabled ? "bg-cyan-500" : "bg-white/15"}`}>
                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${ch.enabled ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              {[["Unread", unread], ["Total", notifications.length]].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}


