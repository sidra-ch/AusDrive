"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import type { RefObject } from "react";

import { locations } from "@/lib/landing-data";

type LocationsSectionProps = { locationsRef: RefObject<HTMLElement | null> };

export function LocationsSection({ locationsRef }: LocationsSectionProps) {
  return (
    <section ref={locationsRef} className="mx-auto mt-24 max-w-7xl px-4 md:mt-32 md:px-6">
      {/* Header — slides from right */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex flex-col gap-3 md:mb-14 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Where We Operate</span>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">Pick Up Anywhere in Australia</h2>
          <p className="mt-1 max-w-lg text-sm text-white/45 md:text-base">60+ pickup locations across every major city and airport.</p>
        </div>
        <Link href="/locations">
          <motion.span whileHover={{ x: 4 }} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
            View all <ArrowRight className="h-4 w-4" />
          </motion.span>
        </Link>
      </motion.div>

      <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-2 xl:grid-cols-5">
        {locations.map((spot, i) => {
          // Alternating: scale, left, up, right, scale
          const inits = [
            { scale: 0.92, x: 0, y: 0 },
            { scale: 1, x: -40, y: 0 },
            { scale: 1, x: 0, y: 40 },
            { scale: 1, x: 40, y: 0 },
            { scale: 0.92, x: 0, y: 0 },
          ];
          const init = inits[i % 5];
          return (
            <motion.article
              key={spot.city}
              initial={{ opacity: 0, ...init }}
              whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04 }}
              className="group relative h-52 cursor-pointer overflow-hidden rounded-2xl border border-white/8 md:h-72 md:rounded-3xl"
            >
              <Image
                src={spot.image}
                alt={spot.city}
                fill
                className="object-cover transition duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06071a]/90 via-[#06071a]/20 to-transparent transition duration-300 group-hover:from-[#06071a]" />
              <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-cyan-400 md:h-3.5 md:w-3.5" />
                  <p className="text-sm font-bold text-white md:text-lg">{spot.city}</p>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-cyan-400 md:text-sm">{spot.price}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-white/0 transition duration-300 group-hover:text-white/60 md:text-xs">
                  Explore <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
