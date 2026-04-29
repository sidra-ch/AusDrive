"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import type { RefObject } from "react";

import { testimonials } from "@/lib/landing-data";

type TestimonialsSectionProps = { testimonialsRef: RefObject<HTMLElement | null> };

export function TestimonialsSection({ testimonialsRef }: TestimonialsSectionProps) {
  return (
    <section ref={testimonialsRef} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      {/* Header — slides from left */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center md:mb-14"
      >
        <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Customer Stories</span>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">Loved Across Australia</h2>
      </motion.div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {testimonials.map((t, i) => {
          const dirs = [{ x: -40, y: 0 }, { x: 0, y: 40 }, { x: 40, y: 0 }];
          const dir = dirs[i];
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, ...dir }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, boxShadow: "0 0 40px rgba(99,102,241,0.18)" }}
              className="group relative rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-xl transition-all hover:border-violet-500/25 md:rounded-3xl md:p-7"
            >
              <Quote className="mb-3 h-6 w-6 text-violet-400/40 md:mb-4 md:h-8 md:w-8" />
              <div className="mb-3 flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400 md:h-4 md:w-4" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-white/65 md:text-base">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-sm font-bold text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] md:h-10 md:w-10">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35">{t.city}, Australia</p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/4 to-violet-500/4 md:rounded-3xl" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
