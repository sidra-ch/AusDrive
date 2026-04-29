"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge, Card, PageWrapper, SectionHeader } from "@/components/dashboard/ui";
import { Fuel, Gauge, MapPin, RefreshCw, Zap } from "lucide-react";

type TrackedCar = {
  id: number;
  car_id: number;
  make: string;
  model: string;
  plate: string;
  car_status: string;
  colour: string;
  lat: number | null;
  lng: number | null;
  speed_kmh: number;
  ignition_on: boolean;
  fuel_level_percent: number | null;
  updated_at: string;
  imei: string;
};

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function LiveMapPage() {
  const [tracking, setTracking] = useState<TrackedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/gps/live");
    const data = await res.json();
    const normalized: TrackedCar[] = (data.tracking ?? []).map((item: TrackedCar) => ({
      ...item,
      lat: toFiniteNumber(item.lat),
      lng: toFiniteNumber(item.lng),
      speed_kmh: toFiniteNumber(item.speed_kmh) ?? 0,
      fuel_level_percent: toFiniteNumber(item.fuel_level_percent),
    }));
    setTracking(normalized);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  // Load Google Maps script (only once)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API key not found");
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || tracking.length === 0) return;

    const validTracking = tracking.filter((car) => car.lat !== null && car.lng !== null);
    if (validTracking.length === 0) return;

    const mapElement = document.getElementById("live-map");
    if (!mapElement) return;

    const centerLat = validTracking.reduce((sum, c) => sum + (c.lat ?? 0), 0) / validTracking.length;
    const centerLng = validTracking.reduce((sum, c) => sum + (c.lng ?? 0), 0) / validTracking.length;

    const map = new (window as any).google.maps.Map(mapElement, {
      zoom: 12,
      center: { lat: centerLat, lng: centerLng },
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9080" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3751ff" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
        { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
      ],
    });

    // Add markers for each car
    validTracking.forEach((car) => {
      if (car.lat === null || car.lng === null) return;

      const marker = new (window as any).google.maps.Marker({
        position: { lat: car.lat, lng: car.lng },
        map: map,
        title: `${car.make} ${car.model} - ${car.plate}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: car.ignition_on ? "#10b981" : "#6b7280",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        new (window as any).google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 8px;">
              <strong>${car.make} ${car.model}</strong><br/>
              Plate: ${car.plate}<br/>
              Speed: ${car.speed_kmh} km/h<br/>
              Fuel: ${car.fuel_level_percent ?? "-"}%<br/>
              Ignition: ${car.ignition_on ? "ON" : "OFF"}
            </div>
          `,
        }).open(map, marker);
      });
    });
  }, [mapLoaded, tracking]);

  const filtered = filter === "All" ? tracking : tracking.filter((c) => c.car_status === filter.toLowerCase());

  return (
    <PageWrapper>
      <SectionHeader
        title="Live Fleet Tracking"
        subtitle="Real-time GPS positions"
        action={
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div id="live-map" className="relative overflow-hidden rounded-3xl border border-border bg-card" style={{ height: "520px" }}>
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-cyan-400 mx-auto mb-3" />
                  <p className="text-foreground text-sm">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "520px" }}>
          <div className="flex gap-2 mb-2">
            {["All", "Rented", "Available"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-xl border px-3 py-1 text-xs transition ${filter === f ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-border bg-muted text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          {loading && <div className="py-8 text-center text-muted-foreground text-sm">Loading GPS data...</div>}
          {!loading && filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">No GPS-equipped vehicles found.<br /><span className="text-xs text-muted-foreground/50">Vehicles need a GPS IMEI assigned.</span></div>
          )}
          {filtered.map((car) => (
            <Card key={car.car_id} className="cursor-pointer hover:border-cyan-500/30 transition p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{car.make} {car.model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{car.plate}</p>
                </div>
                <Badge label={car.car_status} variant={car.car_status === "rented" ? "info" : "success"} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Gauge, label: "Speed", value: `${car.speed_kmh} km/h` },
                  { icon: Fuel, label: "Fuel", value: `${car.fuel_level_percent ?? "-"}%` },
                  { icon: Zap, label: "Ignition", value: car.ignition_on ? "ON" : "OFF" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted p-2 text-center">
                    <s.icon className={`mx-auto mb-1 h-3 w-3 ${s.label === "Ignition" && car.ignition_on ? "text-emerald-400" : "text-cyan-400"}`} />
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className="text-xs font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/50">
                {car.lat !== null && car.lng !== null
                  ? `${car.lat.toFixed(4)}, ${car.lng.toFixed(4)}`
                  : "Location unavailable"} - {formatDistanceToNow(new Date(car.updated_at))} ago
              </p>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
