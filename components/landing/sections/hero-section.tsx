"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type MotionValue } from "framer-motion";
import { Star } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { locationOptions } from "@/lib/landing-data";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { useTheme } from "@/components/theme-provider";

type HeroSectionProps = {
  heroRef: RefObject<HTMLElement | null>;
  heroParallax: MotionValue<number>;
  floatingY: MotionValue<number>;
};

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } } },
  item: { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } },
} as const;

export function HeroSection({ heroRef, heroParallax }: HeroSectionProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({
    location: "Sydney",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    carType: "all",
  });
  const [formError, setFormError] = useState("");

  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateTrip() {
    if (!form.location.trim()) {
      return "Please enter pickup location.";
    }

    if (!form.pickupDate || !form.returnDate) {
      return "Please select pickup and return dates.";
    }

    const pickup = new Date(`${form.pickupDate}T${form.pickupTime || "00:00"}`);
    const dropoff = new Date(`${form.returnDate}T${form.returnTime || "00:00"}`);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime()) || dropoff <= pickup) {
      return "Return date/time must be after pickup date/time.";
    }

    return "";
  }

  function goToBookNow() {
    router.push("/book");
  }

  function goToBookWithTripDetails() {
    const validationError = validateTrip();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const params = new URLSearchParams({
      location: form.location,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      returnDate: form.returnDate,
      returnTime: form.returnTime,
      carType: form.carType,
    });
    router.push(`/book?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const validationError = validateTrip();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const params = new URLSearchParams({
      location: form.location,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      returnDate: form.returnDate,
      returnTime: form.returnTime,
      carType: form.carType,
    });
    router.push(`/cars?${params.toString()}`);
  }

  const shellClass = isDark
    ? "rounded-xl border border-white/10 bg-[#06071a]/75 p-3.5 md:p-4"
    : "rounded-xl border border-slate-200 bg-white/90 p-3.5 md:p-4";

  const labelClass = isDark
    ? "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40"
    : "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500";

  const inputClass = isDark
    ? "w-full bg-transparent text-sm font-medium text-white outline-none"
    : "w-full bg-transparent text-sm font-medium text-slate-900 outline-none";

  return (
    <section
      ref={heroRef}
      className={`relative flex min-h-screen flex-col overflow-hidden ${
        isDark ? "bg-[#06071a]" : "bg-slate-100"
      }`}
      style={{ paddingTop: "72px" }}
    >
      {/* Cinematic car video background */}
      <motion.div style={{ y: heroParallax }} className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.75 }}
        >
          <source
            src="https://www.shutterstock.com/shutterstock/videos/3405805563/preview/stock-footage-aurangabad-india-dec-d-rendered-cinematic-camera-view-of-violet-colored-douche.webm"
            type="video/webm"
          />
          <source
            src="https://media.istockphoto.com/id/1318177957/video/red-supercar-going-on-road-3d-seamless-animation.mp4?s=mp4-640x640-is&k=20&c=1zm7WBtGyLVyqh0iDQARrNZRiS7aZEqopO4Fe4iN4Dc="
            type="video/mp4"
          />
        </video>
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-r from-[#06071a]/90 via-[#06071a]/55 to-[#06071a]/20"
              : "bg-gradient-to-r from-slate-100/90 via-slate-100/70 to-slate-100/50"
          }`}
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-t from-[#06071a] via-transparent to-[#06071a]/40"
              : "bg-gradient-to-t from-slate-100 via-transparent to-slate-100/60"
          }`}
        />
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(99,60,241,0.12),transparent)]"
              : "bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(56,189,248,0.18),transparent)]"
          }`}
        />
      </motion.div>

      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "160px 160px",
          opacity: 0.6,
        }}
      />

      {/* Blob */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="blob h-[500px] w-[500px] bg-violet-600 left-[-150px] top-[-80px]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-40 pt-8 md:px-6">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.14, delayChildren: 0.2 }}
          className="max-w-3xl space-y-7"
        >
          <motion.div variants={stagger.item} transition={{ duration: 0.7, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-cyan-300" />
              Rated #1 Car Rental in Australia
            </span>
          </motion.div>

          <motion.h1
            variants={stagger.item}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`text-[2.2rem] font-bold leading-[1.04] tracking-tight sm:text-[2.8rem] md:text-[3.6rem] xl:text-[4.8rem] ${
              isDark
                ? "text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]"
                : "text-slate-900 drop-shadow-[0_2px_20px_rgba(255,255,255,0.55)]"
            }`}
          >
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                AusDrive
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 1, ease: "easeOut" }}
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 opacity-80"
              />
            </span>
            <br />
            <span className={isDark ? "text-white/90" : "text-slate-800"}>Premium Car Rental</span>
          </motion.h1>

          <motion.p
            variants={stagger.item}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`max-w-lg text-xl leading-relaxed ${
              isDark
                ? "text-white/60 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]"
                : "text-slate-700"
            }`}
          >
            Australia&apos;s most trusted fleet — 1,200+ vehicles, 60+ locations, instant booking.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={stagger.item} transition={{ duration: 0.7, ease: "easeOut" }} className="flex flex-wrap gap-4 pt-2">
            <Button type="button" onClick={goToBookNow} className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-10 py-3.5 text-base font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.55)] transition-all hover:scale-[1.04] hover:shadow-[0_0_60px_rgba(99,102,241,0.75)]">
              <span className="relative z-10">Book Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Button>
            <Button
              variant="outline"
              className={`rounded-full px-10 py-3.5 text-base backdrop-blur ${
                isDark
                  ? "border-white/20 bg-black/30 text-white hover:border-white/40 hover:bg-black/50"
                  : "border-slate-300 bg-white/80 text-slate-900 hover:border-slate-400 hover:bg-white"
              }`}
            >
              View Fleet
            </Button>
          </motion.div>

          {/* Stat pills */}
          <motion.div variants={stagger.item} transition={{ duration: 0.7, ease: "easeOut" }} className="flex flex-wrap gap-3 pt-1">
            {[
              { label: "4.9/5", sub: "Rating" },
              { label: "1,200+", sub: "Vehicles" },
              { label: "$29/day", sub: "From" },
              { label: "60+", sub: "Locations" },
            ].map((b, i) => (
              <motion.div
                key={b.label}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 backdrop-blur-md ${
                  isDark ? "border border-white/12 bg-black/35" : "border border-slate-200 bg-white/85"
                }`}
              >
                <p className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{b.label}</p>
                <p className={`text-xs ${isDark ? "text-white/40" : "text-slate-500"}`}>{b.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Search bar — modern, mobile-first */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
          className={`overflow-visible rounded-2xl backdrop-blur-2xl md:rounded-3xl ${
            isDark
              ? "border border-white/12 bg-black/55 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
              : "border border-slate-200 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.15)]"
          }`}
        >
          {/* Header strip — desktop only */}
          <div
            className={`hidden items-center gap-2 px-5 py-2.5 md:flex ${
              isDark ? "border-b border-white/8" : "border-b border-slate-200"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span
              className={`text-[10px] font-bold tracking-[0.3em] uppercase ${
                isDark ? "text-white/35" : "text-slate-500"
              }`}
            >
              Find Your Perfect Ride
            </span>
          </div>

          <form onSubmit={handleSearch} className={`p-3 md:p-4 ${isDark ? "bg-white/8" : "bg-slate-50/70"}`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.1 }} className={`${shellClass} lg:col-span-2`}>
                <label className={labelClass}>Where</label>
                <SearchableSelect
                  value={form.location}
                  onChange={(val) => updateForm("location", val)}
                  options={[...locationOptions]}
                  placeholder="Search city..."
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.16 }} className={shellClass}>
                <label className={labelClass}>Pickup Date</label>
                <input
                  type="date"
                  min={today}
                  value={form.pickupDate}
                  onChange={(e) => updateForm("pickupDate", e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.22 }} className={shellClass}>
                <label className={labelClass}>Pickup Time</label>
                <input
                  type="time"
                  value={form.pickupTime}
                  onChange={(e) => updateForm("pickupTime", e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.28 }} className={shellClass}>
                <label className={labelClass}>Return Date</label>
                <input
                  type="date"
                  min={form.pickupDate || today}
                  value={form.returnDate}
                  onChange={(e) => updateForm("returnDate", e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.34 }} className={shellClass}>
                <label className={labelClass}>Return Time</label>
                <input
                  type="time"
                  value={form.returnTime}
                  onChange={(e) => updateForm("returnTime", e.target.value)}
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.4 }} className={shellClass}>
                <label className={labelClass}>Vehicle</label>
                <select
                  value={form.carType}
                  onChange={(e) => updateForm("carType", e.target.value)}
                  className={`w-full rounded-md px-3 py-2 text-[15px] font-semibold leading-6 outline-none ${
                    isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <option value="all" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>All Types</option>
                  <option value="Economy" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>Economy</option>
                  <option value="SUV" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>SUV</option>
                  <option value="Luxury" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>Luxury</option>
                  <option value="People Mover" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>People Mover</option>
                  <option value="Convertible" className={isDark ? "bg-[#0a0b1e] text-white" : "bg-white text-slate-900"}>Convertible</option>
                </select>
              </motion.div>
            </div>

            {formError && (
              <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 md:text-sm">
                {formError}
              </p>
            )}

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.46 }} className="mt-3 md:mt-4">
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(99,102,241,0.6)]">
                Search Cars
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
