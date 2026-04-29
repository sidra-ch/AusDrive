"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { RefObject } from "react";

import { faqs } from "@/lib/landing-data";

type FaqSectionProps = { faqRef: RefObject<HTMLElement | null> };

export function FaqSection({ faqRef }: FaqSectionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section ref={faqRef} className="mx-auto mt-24 max-w-3xl px-4 md:mt-32 md:px-6">
      {/* Header — slides up */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center md:mb-14"
      >
        <span className="text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">FAQ</span>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">Frequently Asked Questions</h2>
      </motion.div>

      <div className="space-y-2.5 md:space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={`overflow-hidden rounded-xl border transition-colors duration-300 backdrop-blur-xl md:rounded-2xl ${
              open === i ? "border-cyan-500/25 bg-white/6" : "border-white/8 bg-white/3"
            }`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-4 text-left md:px-6 md:py-5"
            >
              <span className={`text-sm font-medium transition-colors md:text-base ${open === i ? "text-white" : "text-white/70"}`}>
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: open === i ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="ml-3 flex-none"
              >
                <ChevronDown className={`h-4 w-4 transition-colors ${open === i ? "text-cyan-400" : "text-white/30"}`} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed text-white/50 md:px-6 md:pb-5">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
