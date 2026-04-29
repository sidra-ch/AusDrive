"use client";

import { motion } from "framer-motion";
import { BadgeCheck, MapPin, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import type { RefObject } from "react";

import { overlapHighlights } from "@/lib/landing-data";

const iconMap: Record<string, LucideIcon> = { Zap, MapPin, ShieldCheck, BadgeCheck };

// Each card comes from a different direction — smaller offsets for mobile smoothness
const dirs = [
  { x: -40, y: 20 },
  { x: 0, y: 40 },
  { x: 0, y: 40 },
  { x: 40, y: 20 },
];

type OverlapStatsSectionProps = { statsRef: RefObject<HTMLElement | null> };

export function OverlapStatsSection({ statsRef }: OverlapStatsSectionProps) {
  return (
    <section ref={statsRef} className="relative z-20 mt-8 px-4 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
        {overlapHighlights.map((item, i) => {
          const Icon = iconMap[item.icon] ?? Zap;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: dirs[i].x, y: dirs[i].y }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, boxShadow: "0 0 40px rgba(99,102,241,0.25)" }}
              className="group rounded-2xl border border-white/8 bg-[#0c0d24]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all md:rounded-3xl md:p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 transition group-hover:border-cyan-500/30 md:mb-4 md:h-11 md:w-11 md:rounded-2xl">
                <Icon className="h-4 w-4 text-cyan-400 md:h-5 md:w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white md:text-base">{item.title}</h3>
              <p className="mt-1 text-xs text-white/45 md:text-sm">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
