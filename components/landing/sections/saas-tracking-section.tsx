"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { saasFeatures } from "@/lib/landing-data";

type SaasTrackingSectionProps = { saasRef: RefObject<HTMLElement | null> };

export function SaasTrackingSection({ saasRef }: SaasTrackingSectionProps) {
  return (
    <section ref={saasRef} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d0f2e] to-[#0a0b1e] p-6 md:rounded-3xl md:p-10 lg:p-16">
        <div className="blob h-96 w-96 bg-violet-600/10 right-0 top-0" />
        <div className="blob h-64 w-64 bg-cyan-500/8 left-0 bottom-0" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-12">

          {/* Left — slides from left */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="transform-gpu will-change-transform"
          >
            <span className="text-xs font-bold tracking-[0.35em] text-violet-400 uppercase">FleetRent Pro</span>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-4xl">Live GPS Fleet Tracking — Built In</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/50 md:text-base">
              Every AusDrive vehicle is equipped with real-time GPS. Complete visibility and control.
            </p>
            <ul className="mt-6 space-y-3 md:mt-8">
              {saasFeatures.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <CheckCircle className="h-4 w-4 flex-none text-cyan-400" />
                  {f}
                </motion.li>
              ))}
            </ul>
            <div className="mt-8">
              <Button className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]">
                Request Fleet Demo
              </Button>
            </div>
          </motion.div>

          {/* Right — slides from right */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative transform-gpu will-change-transform"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 blur-xl md:rounded-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
                alt="Fleet tracking dashboard"
                width={600}
                height={400}
                className="w-full object-cover opacity-80"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07081f]/60 to-transparent" />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 backdrop-blur md:left-4 md:top-4">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Live Tracking Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
