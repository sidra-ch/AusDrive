"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Badge, Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type MaintRecord = Record<string, unknown>;

function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }
function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/maintenance")
      .then((r) => r.json())
      .then((d) => { setRecords(d.maintenance ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const upcoming = records.filter((r) => r.status === "scheduled");
  const completed = records.filter((r) => r.status === "completed");
  const totalCost = records.reduce((s, r) => s + parseFloat(String(r.cost ?? 0)), 0);

  return (
    <PageWrapper>
      <SectionHeader
        title="Maintenance"
        subtitle="Service logs & reminders"
        action={
          <div className="flex gap-2">
            <GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn>
            <Link href="/dashboard/maintenance/new"><PrimaryBtn><Plus className="h-4 w-4" /> Add Service</PrimaryBtn></Link>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Upcoming Services", value: upcoming.length, color: "text-amber-400" },
          { label: "Completed This Month", value: completed.length, color: "text-emerald-400" },
          { label: "Total Cost", value: fmt(totalCost), color: "text-cyan-400" },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-foreground">Upcoming Services</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => (
              <div key={String(m.id)} className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg flex-none">M</div>
                <div>
                  <p className="font-medium text-foreground">{String(m.make ?? "")} {String(m.model ?? "")} - {String(m.type)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{String(m.description ?? "")}</p>
                  <p className="text-xs text-amber-400 mt-1">Scheduled: {fmtDate(m.service_date)} - {fmt(m.cost)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All records */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div>
      ) : (
        <Table>
          <thead>
            <tr><Th>ID</Th><Th>Car</Th><Th>Type</Th><Th>Date</Th><Th>Cost</Th><Th>Provider</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {records.map((m) => (
              <tr key={String(m.id)} className="hover:bg-white/3 transition">
                <Td><span className="font-mono text-cyan-400">#{String(m.id)}</span></Td>
                <Td>
                  <div>
                    <p className="font-medium text-foreground">{String(m.make ?? "")} {String(m.model ?? "")}</p>
                    <p className="text-xs text-muted-foreground">{String(m.plate ?? "")}</p>
                  </div>
                </Td>
                <Td>{String(m.type)}</Td>
                <Td>{fmtDate(m.service_date)}</Td>
                <Td className="font-semibold text-foreground">{fmt(m.cost)}</Td>
                <Td className="text-muted-foreground">{String(m.provider ?? "-")}</Td>
                <Td><Badge label={String(m.status)} variant={m.status === "completed" ? "success" : m.status === "in_progress" ? "info" : "warning"} /></Td>
              </tr>
            ))}
            {records.length === 0 && <tr><Td colSpan={7} className="text-center text-muted-foreground py-10">No maintenance records</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
