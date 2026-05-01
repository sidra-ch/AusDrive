"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, CalendarCheck, Car, CheckCircle,
  Clock, DollarSign, Key, TrendingUp, Users, Eye,
} from "lucide-react";
import { Badge, Card, PageWrapper, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";
import { CardSkeleton, ChartSkeleton, TableRowSkeleton } from "@/components/dashboard/loading";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
type KPIs = {
  totalCars: number; availableCars: number; rentedCars: number; maintenanceCars: number;
  totalCustomers: number; activeRentals: number; overdueRentals: number; dueToday: number;
  todayRevenue: number; monthRevenue: number; totalRevenue: number; todayViews: number;
};

function fmt(n: number) { return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n); }
function statusVariant(s: string): "success" | "danger" | "warning" | "info" | "neutral" {
  if (s === "active") return "success";
  if (s === "overdue") return "danger";
  if (s === "paid") return "success";
  if (s === "partial") return "warning";
  if (s === "unpaid") return "danger";
  return "neutral";
}

function RevenueChart({ data }: { data: { month: string; revenue: string }[] }) {
  const formatted = data.map((d) => ({ month: d.month, revenue: parseFloat(d.revenue) }));
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tooltipBg = isDark ? "#0c0d24" : "#ffffff";
  const tooltipBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)";
  const tooltipColor = isDark ? "white" : "black";
  
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip contentStyle={{ background: tooltipBg, border: tooltipBorder, borderRadius: 12, color: tooltipColor }} formatter={(v) => typeof v === "number" ? [`$${v.toLocaleString()}`, "Revenue"] : v} />
        <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{ kpis: KPIs; recentRentals: Record<string, unknown>[]; pendingPayments: Record<string, unknown>[]; revenueChart: { month: string; revenue: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpis = stats?.kpis;

  const kpiCards = [
    { label: "Total Cars", value: kpis?.totalCars ?? "-", icon: Car, trend: "up", change: "" },
    { label: "Available", value: kpis?.availableCars ?? "-", icon: CheckCircle, trend: "up", change: "" },
    { label: "Rented", value: kpis?.rentedCars ?? "-", icon: Key, trend: "neutral", change: "" },
    { label: "Customers", value: kpis?.totalCustomers ?? "-", icon: Users, trend: "up", change: "" },
    { label: "Due Today", value: kpis?.dueToday ?? "-", icon: Clock, trend: "neutral", change: "" },
    { label: "Overdue", value: kpis?.overdueRentals ?? "-", icon: AlertTriangle, trend: "down", change: "" },
    { label: "Today Revenue", value: kpis ? fmt(kpis.todayRevenue) : "-", icon: DollarSign, trend: "up", change: "" },
    { label: "Monthly Revenue", value: kpis ? fmt(kpis.monthRevenue) : "-", icon: TrendingUp, trend: "up", change: "" },
    { label: "Today Views", value: kpis?.todayViews ?? "-", icon: Eye, trend: "up", change: "" },
  ];

  if (loading) return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-muted mb-2" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>

        {/* KPI Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Chart skeleton */}
        <ChartSkeleton />

        {/* Table skeleton */}
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-6 w-40 rounded bg-muted mb-2" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Due</Th><Th>Amount</Th><Th>Status</Th></tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back - {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpiCards.map((k, i) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 backdrop-blur-xl hover:border-cyan-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-foreground">{String(k.value)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 transition-transform duration-300 group-hover:scale-110">
                <k.icon className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {stats?.revenueChart && stats.revenueChart.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SectionHeader title="Monthly Revenue" subtitle="Last 6 months" />
          <RevenueChart data={stats.revenueChart} />
        </Card>
      )}

      {/* Recent rentals */}
      <div>
        <SectionHeader title="Recent Rentals" subtitle="Latest activity" />
        <Table>
          <thead>
            <tr><Th>ID</Th><Th>Customer</Th><Th>Car</Th><Th>Start</Th><Th>Due</Th><Th>Amount</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {(stats?.recentRentals ?? []).map((r, i) => (
              <tr key={String(r.id)} className="hover:bg-muted/50 transition-all duration-200 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 30}ms` }}>
                <Td><span className="font-mono text-cyan-400">#{String(r.id)}</span></Td>
                <Td>{String(r.customer_name ?? "-")}</Td>
                <Td className="text-muted-foreground">{String(r.make ?? "")} {String(r.model ?? "")}</Td>
                <Td>{r.start_date ? new Date(String(r.start_date)).toLocaleDateString("en-AU") : "-"}</Td>
                <Td>{r.expected_return ? new Date(String(r.expected_return)).toLocaleDateString("en-AU") : "-"}</Td>
                <Td className="font-semibold text-foreground">{fmt(parseFloat(String(r.total_amount ?? 0)))}</Td>
                <Td><Badge label={String(r.status)} variant={statusVariant(String(r.status))} /></Td>
              </tr>
            ))}
            {(stats?.recentRentals ?? []).length === 0 && (
              <tr><Td colSpan={7} className="text-center text-muted-foreground py-8">No rentals yet</Td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </PageWrapper>
  );
}
