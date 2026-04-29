"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto mt-32 max-w-7xl px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0f2e] via-[#12103a] to-[#0d0f2e] px-8 py-20 text-center shadow-[0_0_80px_rgba(99,102,241,0.2)]"
      >
        <div className="blob h-80 w-80 bg-cyan-500/15 left-[-60px] top-[-40px]" />
        <div className="blob h-80 w-80 bg-violet-500/15 right-[-60px] bottom-[-40px]" />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-500/20"
        />
        <div className="relative z-10">
          <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">Get Started Today</span>
          <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl xl:text-6xl">Ready to Hit the Road?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
            Join 50,000+ Australians who trust AusDrive for premium car rentals. Book in under 2 minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/cars">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-10 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_rgba(99,102,241,0.7)]">
                  <span className="relative z-10 flex items-center gap-2">Book Your Car Now <ArrowRight className="h-5 w-5" /></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/locations">
              <Button variant="outline" className="rounded-full border-white/15 bg-white/4 px-10 py-4 text-lg text-white backdrop-blur hover:border-white/30 hover:bg-white/10">
                View All Locations
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            {["No credit card required", "Free cancellation", "Instant confirmation", "24/7 support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-cyan-400" />{t}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
