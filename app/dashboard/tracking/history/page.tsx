"use client";

import { useEffect, useState } from "react";
import { Card, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";
import { Play } from "lucide-react";

type ApiCar = { id: number; make: string; model: string; plate: string; };
type GpsPoint = { id: number; car_id: number; lat: number; lng: number; speed_kmh: number; heading: number | null; recorded_at: string; make: string; model: string; };

export default function TrackingHistoryPage() {
  const [cars, setCars] = useState<ApiCar[]>([]);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/cars").then((r) => r.json()).then((d) => {
      const gpsCars = (d.cars ?? []).filter((c: ApiCar & { gps_imei?: string }) => c.gps_imei);
      setCars(d.cars ?? []);
      if (gpsCars.length) setSelectedCarId(String(gpsCars[0].id));
      else if (d.cars?.length) setSelectedCarId(String(d.cars[0].id));
    });
  }, []);

  async function loadRoute() {
    if (!selectedCarId) return;
    setLoading(true);
    const params = new URLSearchParams({ car_id: selectedCarId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/gps/history?${params}`);
    const data = await res.json();
    setPoints(data.points ?? []);
    setLoaded(true);
    setLoading(false);
  }

  // Stats
  const maxSpeed = points.length ? Math.max(...points.map((p) => p.speed_kmh ?? 0)) : 0;
  const avgSpeed = points.length ? Math.round(points.reduce((s, p) => s + (p.speed_kmh ?? 0), 0) / points.length) : 0;

  // SVG route: map lat/lng to canvas coords
  const routePoints = points.slice(0, 100); // cap for SVG
  function toSvg(point: GpsPoint, idx: number) {
    return { x: 60 + (idx / Math.max(routePoints.length - 1, 1)) * 480, y: 460 - (((point.speed_kmh ?? 0) / Math.max(maxSpeed, 1)) * 360) };
  }

  return (
    <PageWrapper>
      <SectionHeader title="Tracking History" subtitle="Route playback & trip analysis" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-5 font-semibold text-foreground">Select Trip</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Vehicle</label>
              <select value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
                {cars.map((c) => <option key={c.id} value={c.id}>{c.make} {c.model} - {c.plate}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">From Date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">To Date</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40" />
            </div>
            <PrimaryBtn className="w-full justify-center" onClick={loadRoute} disabled={loading}>
              <Play className="h-4 w-4" /> {loading ? "Loading..." : "Load Route"}
            </PrimaryBtn>
          </div>

          {loaded && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Summary</h4>
              {[
                ["Points", points.length],
                ["Max Speed", `${maxSpeed} km/h`],
                ["Avg Speed", `${avgSpeed} km/h`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold text-foreground">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
          {loaded && points.length > 0 && (
            <GhostBtn className="mt-4 w-full justify-center" onClick={() => {
              const csv = ["recorded_at,lat,lng,speed_kmh", ...points.map((p) => `${p.recorded_at},${p.lat},${p.lng},${p.speed_kmh}`)].join("\n");
              const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv])); a.download = "route.csv"; a.click();
            }}>Export CSV</GhostBtn>
          )}
        </Card>

        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#0c0d24]" style={{ height: "520px" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            {loaded && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No GPS data for this vehicle and date range.</div>
            )}

            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Select a vehicle and load the route.</div>
            )}

            {loaded && points.length > 0 && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 520" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <polyline
                  points={routePoints.map((p, i) => { const c = toSvg(p, i); return `${c.x},${c.y}`; }).join(" ")}
                  fill="none" stroke="url(#routeGrad)" strokeWidth="3" strokeDasharray="8 4" />
                {[routePoints[0], routePoints[routePoints.length - 1]].filter(Boolean).map((p, i) => {
                  const c = toSvg(p, i === 0 ? 0 : routePoints.length - 1);
                  return <circle key={i} cx={c.x} cy={c.y} r="6" fill="#22d3ee" stroke="#0c0d24" strokeWidth="2" />;
                })}
              </svg>
            )}

            <div className="absolute bottom-4 left-4 flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />Start / End
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted-foreground">
                Google Maps integration requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
