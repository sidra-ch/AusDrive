"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { RefObject } from "react";

type BudgetVsLuxurySectionProps = { vsRef: RefObject<HTMLElement | null> };

export function BudgetVsLuxurySection({ vsRef }: BudgetVsLuxurySectionProps) {
  const [hovered, setHovered] = useState<"budget" | "luxury" | null>(null);

  return (
    <section ref={vsRef} className="mx-auto mt-32 max-w-7xl px-6">
      <div className="mb-14 text-center">
        <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Find Your Fit</span>
        <h2 data-reveal className="mt-2 text-3xl font-bold text-white md:text-4xl">Budget or Luxury — We Have Got You</h2>
      </div>

      <div className="relative flex flex-col gap-4 lg:flex-row lg:overflow-hidden lg:rounded-3xl" style={{ minHeight: 0 }}>
        <motion.div
          onHoverStart={() => setHovered("budget")}
          onHoverEnd={() => setHovered(null)}
          animate={{ flex: hovered === "budget" ? 1.6 : hovered === "luxury" ? 0.6 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative min-h-[280px] cursor-pointer overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/10 lg:min-h-[420px]"
          style={{ minWidth: 0 }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=60')] bg-cover bg-center opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8">
            <motion.div animate={{ opacity: hovered === "budget" ? 1 : 0.7, y: hovered === "budget" ? 0 : 10 }} transition={{ duration: 0.4 }}>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Budget</span>
              <h3 className="mt-2 text-3xl font-bold text-white">Smart &amp; Affordable</h3>
              <p className="mt-2 text-white/60">Reliable, fuel-efficient vehicles for city commutes and road trips.</p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/50">
                {["Economy & compact vehicles", "Fuel-efficient options", "Ideal for solo or couple travel"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-none" />{f}</li>
                ))}
              </ul>
              <p className="mt-6 text-3xl font-bold text-emerald-400">From $25<span className="text-lg font-normal text-white/40">/day</span></p>
            </motion.div>
          </div>
          <motion.div animate={{ opacity: hovered === "budget" ? 1 : 0 }} className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(16,185,129,0.15)]" />
        </motion.div>

        <div className="relative z-20 hidden flex-none items-center justify-center lg:flex">
          <motion.div animate={{ scale: hovered ? 0.9 : 1 }} transition={{ duration: 0.3 }} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#0d0f2e]/90 text-base font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-xl">VS</motion.div>
        </div>

        <motion.div
          onHoverStart={() => setHovered("luxury")}
          onHoverEnd={() => setHovered(null)}
          animate={{ flex: hovered === "luxury" ? 1.6 : hovered === "budget" ? 0.6 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative min-h-[280px] cursor-pointer overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-zinc-900/80 via-amber-900/20 to-zinc-900/80 lg:min-h-[420px]"
          style={{ minWidth: 0 }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=60')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8">
            <motion.div animate={{ opacity: hovered === "luxury" ? 1 : 0.7, y: hovered === "luxury" ? 0 : 10 }} transition={{ duration: 0.4 }}>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Luxury</span>
              <h3 className="mt-2 text-3xl font-bold text-white">Premium &amp; Prestigious</h3>
              <p className="mt-2 text-white/60">World-class comfort for business travel, events, and executive transfers.</p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/50">
                {["BMW, Mercedes, Audi & more", "Leather interiors & premium tech", "Ideal for business & events"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-none" />{f}</li>
                ))}
              </ul>
              <p className="mt-6 text-3xl font-bold text-amber-400">From $120<span className="text-lg font-normal text-white/40">/day</span></p>
            </motion.div>
          </div>
          <motion.div animate={{ opacity: hovered === "luxury" ? 1 : 0 }} className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_60px_rgba(251,191,36,0.12)]" />
        </motion.div>
      </div>
    </section>
  );
}
