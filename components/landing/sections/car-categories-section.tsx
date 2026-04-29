"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { RefObject } from "react";

import { carCategories } from "@/lib/landing-data";

type CarCategoriesSectionProps = { categoriesRef: RefObject<HTMLElement | null> };

export function CarCategoriesSection({ categoriesRef }: CarCategoriesSectionProps) {
  return (
    <section ref={categoriesRef} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      {/* Header — slides down */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Our Fleet</span>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">Browse by Category</h2>
          <p className="mt-1 max-w-md text-sm text-white/45 md:text-base">From budget-friendly to head-turning luxury.</p>
        </div>
        <motion.a href="/cars" whileHover={{ x: 4 }} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300">
          View all <ArrowRight className="h-4 w-4" />
        </motion.a>
      </motion.div>

      {/* Cards — alternating left/right/bottom */}
      <div className="grid gap-4 grid-cols-2 md:gap-5 xl:grid-cols-5">
        {carCategories.map((car, i) => {
          // Alternate: 0=left, 1=bottom, 2=right, 3=bottom, 4=left — reduced for mobile
          const initials = [
            { x: -40, y: 0 },
            { x: 0, y: 40 },
            { x: 40, y: 0 },
            { x: 0, y: 40 },
            { x: -40, y: 0 },
          ];
          const init = initials[i % 5];
          return (
            <motion.article
              key={car.name}
              initial={{ opacity: 0, ...init }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, boxShadow: "0 0 40px rgba(99,102,241,0.28)" }}
              className="group cursor-pointer rounded-2xl border border-white/8 bg-white/4 p-2.5 backdrop-blur-xl transition-all hover:border-violet-500/40 md:rounded-3xl md:p-3"
            >
              <div className="relative h-36 overflow-hidden rounded-xl md:h-44 md:rounded-2xl">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                    {car.specs}
                  </span>
                </div>
              </div>
              <div className="mt-3 px-1 pb-1">
                <h3 className="text-sm font-semibold text-white md:text-base">{car.name}</h3>
                <p className="mt-0.5 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-xs font-bold text-transparent md:text-sm">
                  {car.price}
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
