"use client";

import Link from "next/link";
import { motion, type MotionValue, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/landing-data";

type NavbarSectionProps = {
  navBg: MotionValue<string>;
  navBorder: MotionValue<string>;
};

export function NavbarSection({ navBg, navBorder }: NavbarSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      style={{ backgroundColor: navBg, borderColor: navBorder }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-2xl"
    >
      {/* Exact 72px height */}
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col leading-none"
        >
          <span className="text-[1.35rem] font-bold tracking-tight text-white">
            Aus<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Drive</span>
          </span>
          <span className="text-[8px] tracking-[0.28em] text-white/30 uppercase">Australia's Finest Fleet</span>
        </motion.div>

        {/* Desktop nav */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden items-center gap-7 text-sm text-white/60 md:flex"
        >
          {[
            { label: "Home", href: "/" },
            { label: "Cars", href: "/cars" },
            { label: "Locations", href: "/locations" },
            { label: "Deals", href: "/deals" },
            { label: "Contact", href: "/contact" },
          ].map((item, i) => (
            <Link key={item.href} href={item.href}>
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                className="relative py-1 transition-colors hover:text-white cursor-pointer block"
                whileHover="hover"
              >
                {item.label}
                <motion.span
                  variants={{ hover: { scaleX: 1 }, initial: { scaleX: 0 } }}
                  initial="initial"
                  className="absolute -bottom-0.5 left-0 h-px w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                />
              </motion.span>
            </Link>
          ))}
        </motion.nav>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden items-center gap-2 md:flex"
        >
          <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-white/50">🇦🇺 AUD</span>
          <Link href="/auth/login">
            <Button variant="ghost" className="rounded-full px-4 text-sm text-white/70 hover:text-white hover:bg-white/8">
              Login
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(99,102,241,0.55)] hover:scale-[1.03] transition-all">
              Sign Up Free
            </Button>
          </Link>
        </motion.div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white md:hidden" onClick={() => setOpen(!open)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={open ? "x" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/8 bg-[#06071a]/96 backdrop-blur-2xl md:hidden"
          >
            <div className="px-6 py-5">
              {[
                { label: "Home", href: "/" },
                { label: "Cars", href: "/cars" },
                { label: "Locations", href: "/locations" },
                { label: "Deals", href: "/deals" },
                { label: "Contact", href: "/contact" },
              ].map((item, i) => (
                <Link key={item.href} href={item.href}>
                  <motion.span
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="block py-2.5 text-sm text-white/60 hover:text-white cursor-pointer"
                  >
                    {item.label}
                  </motion.span>
                </Link>
              ))}
              <div className="mt-5 flex gap-2">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="ghost" className="w-full rounded-full text-white/70">Login</Button>
                </Link>
                <Link href="/auth/signup" className="flex-1">
                  <Button className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white">Sign Up</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
