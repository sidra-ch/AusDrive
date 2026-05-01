"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Fuel, Gauge, MapPin, Pencil, Wrench, Zap } from "lucide-react";
import { Badge, Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";

type Car = Record<string, unknown>;
type Rental = Record<string, unknown>;
type Maint = Record<string, unknown>;

function statusVariant(s: string): "success" | "danger" | "warning" | "info" | "neutral" {
  if (s === "available") return "success"; if (s === "rented") return "info";
  if (s === "maintenance") return "warning"; return "neutral";
}
function fmtDate(d: unknown) { return d ? new Date(String(d)).toLocaleDateString("en-AU") : "-"; }

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [car, setCar] = useState<Car | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [maintenance, setMaintenance] = useState<Maint[]>([]);
  const [gps, setGps] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      fetch(`/api/cars/${pid}`)
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((d) => { setCar(d.car); setRentals(d.rentals ?? []); setMaintenance(d.maintenance ?? []); setGps(d.gps); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [params]);

  async function markMaintenance() {
    await fetch(`/api/cars/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "maintenance" }) });
    setCar((c) => c ? { ...c, status: "maintenance" } : c);
  }

  async function markAvailable() {
    await fetch(`/api/cars/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "available" }) });
    setCar((c) => c ? { ...c, status: "available" } : c);
  }

  if (loading) return <PageWrapper><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div></PageWrapper>;
  if (!car) return <PageWrapper><p className="text-muted-foreground">Car not found.</p></PageWrapper>;

  return (
    <PageWrapper>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/cars"><GhostBtn className="px-2 py-1.5"><ArrowLeft className="h-4 w-4" /></GhostBtn></Link>
        <SectionHeader
          title={`${String(car.make)} ${String(car.model)}`}
          subtitle={`${String(car.plate)} - ${String(car.year)}`}
          action={
            <div className="flex gap-2">
              <Link href={`/dashboard/bookings/new?car_id=${id}`}><PrimaryBtn>Start Rental</PrimaryBtn></Link>
              {car.status !== "maintenance"
                ? <GhostBtn onClick={markMaintenance}><Wrench className="h-4 w-4" /> Mark Maintenance</GhostBtn>
                : <GhostBtn onClick={markAvailable}>Mark Available</GhostBtn>}
              <Link href={`/dashboard/cars/${id}/edit`}><GhostBtn><Pencil className="h-4 w-4" /></GhostBtn></Link>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* GPS live stats */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Live Status</h3>
              {gps ? (
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300">GPS Active</span>
                </div>
              ) : <span className="text-xs text-muted-foreground">No GPS data</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Gauge, label: "Speed", value: gps ? `${gps.speed} km/h` : "-" },
                { icon: Fuel, label: "Fuel", value: gps ? `${gps.fuel_level ?? "-"}%` : "-" },
                { icon: Zap, label: "Ignition", value: gps ? (gps.ignition ? "ON" : "OFF") : "-" },
                { icon: MapPin, label: "Updated", value: gps ? new Date(String(gps.updated_at)).toLocaleTimeString("en-AU") : "-" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-input bg-background p-3 text-center">
                  <s.icon className="mx-auto mb-1.5 h-4 w-4 text-cyan-400" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Rental history */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Rental History</h3>
            <Table>
              <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Start</Th><Th>Return</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={String(r.id)} className="hover:bg-white/3 transition">
                    <Td><Link href={`/dashboard/rentals/${r.id}`}><span className="font-mono text-cyan-400">#{String(r.id)}</span></Link></Td>
                    <Td>{String(r.customer_name ?? "-")}</Td>
                    <Td>{fmtDate(r.start_date)}</Td>
                    <Td>{fmtDate(r.expected_return)}</Td>
                    <Td className="font-semibold text-foreground">${parseFloat(String(r.total_amount ?? 0)).toFixed(0)}</Td>
                    <Td><Badge label={String(r.status)} variant={r.status === "active" ? "success" : r.status === "overdue" ? "danger" : "neutral"} /></Td>
                  </tr>
                ))}
                {rentals.length === 0 && <tr><Td colSpan={6} className="text-center text-muted-foreground py-6">No rental history</Td></tr>}
              </tbody>
            </Table>
          </div>

          {/* Maintenance history */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Maintenance History</h3>
            <Table>
              <thead><tr><Th>Type</Th><Th>Date</Th><Th>Cost</Th><Th>Status</Th></tr></thead>
              <tbody>
                {maintenance.map((m) => (
                  <tr key={String(m.id)} className="hover:bg-white/3 transition">
                    <Td>{String(m.type)}</Td>
                    <Td>{fmtDate(m.service_date)}</Td>
                    <Td className="font-semibold text-foreground">${parseFloat(String(m.cost ?? 0)).toFixed(0)}</Td>
                    <Td><Badge label={String(m.status)} variant={m.status === "completed" ? "success" : "warning"} /></Td>
                  </tr>
                ))}
                {maintenance.length === 0 && <tr><Td colSpan={4} className="text-center text-muted-foreground py-6">No maintenance records</Td></tr>}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Vehicle Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd><Badge label={String(car.status)} variant={statusVariant(String(car.status))} /></dd>
              </div>
              {([
                ["Category", car.category], ["Colour", car.colour ?? "-"],
                ["Transmission", car.transmission], ["Fuel", car.fuel_type],
                ["Seats", car.seats], ["Bags", car.bags],
                ["Odometer", `${car.odometer} km`],
                ["Daily Rate", `$${parseFloat(String(car.daily_rate)).toFixed(0)}/day`],
                ["Deposit", `$${parseFloat(String(car.deposit ?? 0)).toFixed(0)}`],
                ["Branch", car.branch],
              ] as [string, unknown][]).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-foreground">{String(v ?? "-")}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-4 font-semibold text-foreground">Insurance</h3>
            <dl className="space-y-3 text-sm">
              {([
                ["Policy", car.insurance_policy ?? "-"],
                ["Provider", car.insurance_provider ?? "-"],
                ["Expires", fmtDate(car.insurance_expiry)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {car.gps_imei ? (
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">GPS Device</h3>
              <p className="font-mono text-xs text-cyan-400">{String(car.gps_imei)}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </PageWrapper>
  );
}
