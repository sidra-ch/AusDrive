"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Badge, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";
import { RefreshCw } from "lucide-react";

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  module: string;
  record_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const moduleVariant: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  Rentals: "info", Cars: "warning", Customers: "success", Payments: "neutral", Bookings: "danger",
  Maintenance: "warning", Users: "info", Settings: "neutral",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audit-logs");
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  return (
    <PageWrapper>
      <SectionHeader
        title="Audit Logs"
        subtitle="All staff actions tracked"
        action={
          <button onClick={fetchLogs} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading audit logs...</div>
      ) : (
        <Table>
          <thead>
            <tr><Th>#</Th><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Time</Th><Th>IP Address</Th></tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No audit logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/3 transition">
                <Td><span className="text-muted-foreground">{log.id}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-[10px] font-bold text-white flex-none">
                      {(log.user_name ?? "?")[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{log.user_name}</span>
                  </div>
                </Td>
                <Td>{log.action}</Td>
                <Td><Badge label={log.module} variant={moduleVariant[log.module] ?? "neutral"} /></Td>
                <Td className="text-muted-foreground text-xs">
                  {log.created_at ? format(new Date(log.created_at), "MMM d, h:mm a") : "-"}
                </Td>
                <Td><span className="font-mono text-xs text-muted-foreground">{log.ip_address ?? "-"}</span></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
