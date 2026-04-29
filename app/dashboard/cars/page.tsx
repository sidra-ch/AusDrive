"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2, RefreshCw, Upload } from "lucide-react";
import { Badge, GhostBtn, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";
import { CSVImport } from "@/components/dashboard/csv-import";

type Car = {
  id: number; make: string; model: string; plate: string; year: number;
  status: string; daily_rate: string; category: string; current_customer?: string; colour?: string;
};

function carStatusVariant(s: string): "success" | "danger" | "warning" | "info" | "neutral" {
  if (s === "available") return "success";
  if (s === "rented") return "info";
  if (s === "maintenance") return "warning";
  return "neutral";
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    fetch(`/api/cars?${params}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { setCars(d.cars ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status, category, search]);

  // Auto-refresh when page comes back into focus
  useEffect(() => {
    const handleFocus = () => load();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  async function deleteCar(id: number) {
    if (!confirm("Delete this car?")) return;
    await fetch(`/api/cars/${id}`, { method: "DELETE" });
    load();
  }

  const hasFilters = status || category || search;
  const categories = ["Economy", "SUV", "Luxury", "People Mover", "Convertible"];

  return (
    <PageWrapper>
      <SectionHeader
        title="Fleet Management"
        subtitle={`${cars.length} vehicles`}
        action={
          <div className="flex gap-2">
            <GhostBtn onClick={load}><RefreshCw className="h-4 w-4" /></GhostBtn>
            <GhostBtn onClick={() => setShowImport(!showImport)}><Upload className="h-4 w-4" /> Import CSV</GhostBtn>
            <Link href="/dashboard/cars/new"><PrimaryBtn><Plus className="h-4 w-4" /> Add Car</PrimaryBtn></Link>
          </div>
        }
      />

      {showImport && (
        <div className="mb-6">
          <CSVImport />
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["", "available", "rented", "maintenance"].map((f) => (
          <button key={f} onClick={() => setStatus(f)}
            className={`rounded-xl border px-4 py-1.5 text-xs transition ${status === f ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground"}`}>
            {f === "" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <div className="flex gap-2 mb-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-input bg-background px-4 py-1.5 text-sm text-foreground outline-none focus:border-cyan-500/40">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search model or plate..."
          className="rounded-xl border border-input bg-background px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 flex-1" />
        {hasFilters && <GhostBtn onClick={() => { setStatus(""); setCategory(""); setSearch(""); }}>Clear</GhostBtn>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /></div>
      ) : (
        <Table>
          <thead>
            <tr><Th>Car</Th><Th>Plate</Th><Th>Year</Th><Th>Category</Th><Th>Daily Rate</Th><Th>Status</Th><Th>Customer</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {cars.map((car, index) => (
              <tr key={`${car.id}-${car.plate}-${index}`} className="hover:bg-white/3 transition">
                <Td>
                  <div>
                    <p className="font-medium text-foreground">{car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground">{car.colour ?? ""}</p>
                  </div>
                </Td>
                <Td><span className="font-mono text-cyan-400">{car.plate}</span></Td>
                <Td>{car.year}</Td>
                <Td>{car.category}</Td>
                <Td className="font-semibold text-foreground">${parseFloat(car.daily_rate).toFixed(0)}/day</Td>
                <Td><Badge label={car.status} variant={carStatusVariant(car.status)} /></Td>
                <Td>{car.current_customer ?? <span className="text-muted-foreground/70">-</span>}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/dashboard/cars/${car.id}`}><GhostBtn className="px-2 py-1.5"><Eye className="h-3.5 w-3.5" /></GhostBtn></Link>
                    <Link href={`/dashboard/cars/${car.id}?edit=1`}><GhostBtn className="px-2 py-1.5"><Pencil className="h-3.5 w-3.5" /></GhostBtn></Link>
                    <GhostBtn onClick={() => deleteCar(car.id)} className="px-2 py-1.5 text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></GhostBtn>
                  </div>
                </Td>
              </tr>
            ))}
            {cars.length === 0 && <tr><Td colSpan={8} className="text-center text-muted-foreground py-10">No cars found</Td></tr>}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
