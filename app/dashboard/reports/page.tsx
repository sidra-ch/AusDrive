"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Card, GhostBtn, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Row = Record<string, unknown>;

function fmt(n: unknown) { return `$${parseFloat(String(n ?? 0)).toFixed(0)}`; }
function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }

function BarChart({ data, valueKey, labelKey, color }: { data: Row[]; valueKey: string; labelKey: string; color: string }) {
  const max = Math.max(...data.map((d) => parseFloat(String(d[valueKey] ?? 0))), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${(parseFloat(String(d[valueKey] ?? 0)) / max) * 100}%`, background: color }} />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{String(d[labelKey] ?? "")}</span>
        </div>
      ))}
    </div>
  );
}

function exportCSV(data: Row[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => `"${String(r[h] ?? "")}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
}

const REPORT_TYPES = [
  { key: "revenue", label: "Revenue Report", desc: "Monthly income breakdown" },
  { key: "utilisation", label: "Fleet Utilisation", desc: "Car usage rate analysis" },
  { key: "car_profit", label: "Car Profit Report", desc: "Per-vehicle profitability" },
  { key: "maintenance_cost", label: "Maintenance Costs", desc: "Service expense summary" },
  { key: "pending_payments", label: "Pending Payments", desc: "Outstanding balances" },
];

export default function ReportsPage() {
  const [activeType, setActiveType] = useState("revenue");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  function load(type: string) {
    setLoading(true);
    setActiveType(type);
    fetch(`/api/reports?type=${type}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setData(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load("revenue"); }, []);

  const activeReport = REPORT_TYPES.find((r) => r.key === activeType);

  return (
    <PageWrapper>
      <SectionHeader
        title="Reports & Analytics"
        subtitle="Business intelligence"
        action={
          <div className="flex gap-2">
            <GhostBtn onClick={() => load(activeType)}><RefreshCw className="h-4 w-4" /></GhostBtn>
            <GhostBtn onClick={() => exportCSV(data, activeType)}><Download className="h-4 w-4" /> Export CSV</GhostBtn>
          </div>
        }
      />

      {/* Report type selector */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {REPORT_TYPES.map((r) => (
          <button key={r.key} onClick={() => load(r.key)}
            className={`rounded-2xl border p-4 text-left transition ${activeType === r.key ? "border-cyan-500/40 bg-cyan-500/8" : "border-input bg-background hover:border-white/20"}`}>
            <p className="text-sm font-semibold text-foreground">{r.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Chart */}
      {activeType === "revenue" && data.length > 0 && (
        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Revenue by Month</h3>
          <BarChart data={data} valueKey="total" labelKey="month" color="linear-gradient(to top, rgba(139,92,246,0.6), rgba(34,211,238,0.6))" />
        </Card>
      )}

      {activeType === "utilisation" && data.length > 0 && (
        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Fleet Utilisation (Days Rented)</h3>
          <BarChart data={data.slice(0, 10)} valueKey="rented_days" labelKey="model" color="linear-gradient(to top, rgba(34,211,238,0.5), rgba(99,102,241,0.5))" />
        </Card>
      )}

      {/* Data table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div>
      ) : (
        <div>
          <h3 className="mb-4 font-semibold text-foreground">{activeReport?.label} - {data.length} records</h3>
          {data.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  {Object.keys(data[0]).map((k) => <Th key={k}>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/3 transition">
                    {Object.entries(row).map(([k, v]) => (
                      <Td key={k}>
                        {k.includes("cost") || k.includes("revenue") || k.includes("profit") || k.includes("total") || k.includes("paid") || k.includes("balance") || k.includes("amount")
                          ? <span className="font-semibold text-foreground">{fmt(v)}</span>
                          : k.includes("date") || k.includes("period")
                          ? fmtDate(v)
                          : String(v ?? "-")}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-2xl border border-input bg-background p-10 text-center text-muted-foreground">No data available</div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
