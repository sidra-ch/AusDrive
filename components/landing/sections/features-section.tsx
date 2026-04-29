"use client";

import { motion } from "framer-motion";
import { Globe, Infinity, Receipt, RotateCcw } from "lucide-react";
import type { RefObject } from "react";

import { benefits } from "@/lib/landing-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Infinity, RotateCcw, Receipt, Globe };

// 3D layered depth — reduced offsets for smooth mobile experience
const cardDirs = [
  { x: -40, y: 0, delay: 0 },
  { x: 0, y: 40, delay: 0.1 },
  { x: 0, y: 40, delay: 0.2 },
  { x: 40, y: 0, delay: 0.3 },
];

type FeaturesSectionProps = { benefitsRef: RefObject<HTMLElement | null> };

export function FeaturesSection({ benefitsRef }: FeaturesSectionProps) {
  return (
    <section ref={benefitsRef} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      {/* Header — fades up */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center md:mb-14"
      >
        <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Why AusDrive</span>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">The AusDrive Difference</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-white/45 md:text-base">Every rental comes with these guarantees — no asterisks, no fine print.</p>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 md:gap-5 xl:grid-cols-4">
        {benefits.map((item, i) => {
          const Icon = iconMap[item.icon];
          const dir = cardDirs[i];
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: dir.x, y: dir.y }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: dir.delay, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, boxShadow: "0 0 40px rgba(99,102,241,0.22)" }}
              className="group relative rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-xl transition-all hover:border-cyan-500/30 md:rounded-3xl md:p-7"
            >
              {/* Depth shadow layer */}
              <div className="absolute -bottom-1.5 -right-1.5 -z-10 h-full w-full rounded-2xl border border-white/4 bg-white/2 md:rounded-3xl" />

              <motion.div
                whileHover={{ rotate: 10, scale: 1.18 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 md:h-12 md:w-12 md:rounded-2xl"
              >
                <Icon className="h-5 w-5 text-cyan-400 md:h-6 md:w-6" />
              </motion.div>
              <h3 className="text-sm font-semibold text-white md:text-base">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45 md:text-sm">{item.desc}</p>

              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 md:rounded-3xl" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
