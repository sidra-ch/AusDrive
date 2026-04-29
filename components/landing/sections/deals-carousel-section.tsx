"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { RefObject } from "react";

import { deals } from "@/lib/landing-data";

type DealsCarouselSectionProps = {
  dealsRef: RefObject<HTMLElement | null>;
  prefersReducedMotion: boolean;
};

export function DealsCarouselSection({ dealsRef, prefersReducedMotion }: DealsCarouselSectionProps) {
  return (
    <section ref={dealsRef} className="mt-28 overflow-hidden">
      <div className="mx-auto mb-12 max-w-7xl px-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-[0.3em] text-cyan-400 uppercase">Limited Time</span>
          <h2 data-reveal className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Hot Deals — Book Before They&apos;re Gone
          </h2>
        </div>
        <Link href="/deals">
          <motion.span whileHover={{ x: 4 }} className="hidden md:flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
            View all <span className="ml-1">→</span>
          </motion.span>
        </Link>
      </div>
      <div className="overflow-hidden">
        <motion.div
          data-reveal
          className="flex gap-5 px-6"
          animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={prefersReducedMotion ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[...deals, ...deals].map((deal, idx) => (
            <article
              key={`${deal.name}-${idx}`}
              className="w-[300px] flex-none rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl"
            >
              <div className="relative h-44 overflow-hidden rounded-2xl">
                <Image src={deal.image} alt={deal.name} fill className="object-cover" sizes="300px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1 text-xs font-bold text-white shadow">
                  {deal.discount}
                </span>
                <button className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/30 p-2 backdrop-blur transition hover:border-rose-400/50">
                  <Heart className="h-4 w-4 text-white/70" />
                </button>
              </div>
              <div className="mt-4 px-1">
                <p className="font-semibold text-white">{deal.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-bold text-cyan-400">{deal.price}</p>
                  <p className="text-sm text-white/30 line-through">{deal.original}</p>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
