"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/count-up";
import { counters } from "@/lib/landing-data";

export function StatsCounterSection() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#0c0d24] via-[#0f1035] to-[#0c0d24] p-8 shadow-[0_0_80px_rgba(99,102,241,0.12)] md:rounded-3xl md:p-12"
      >
        <div className="blob h-64 w-64 bg-cyan-500/8 left-[-60px] top-[-40px]" />
        <div className="blob h-64 w-64 bg-violet-500/8 right-[-60px] bottom-[-40px]" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 text-center md:mb-10"
          >
            <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">By The Numbers</span>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">Trusted Across Australia</h2>
          </motion.div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {counters.map((counter, i) => (
              <motion.div
                key={counter.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <CountUp target={counter.value} suffix={counter.suffix} label={counter.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
