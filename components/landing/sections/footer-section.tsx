"use client";

import Link from "next/link";
import { Globe, Mail, MapPin, Phone, Send } from "lucide-react";
import type { RefObject } from "react";

type FooterSectionProps = { footerRef: RefObject<HTMLElement | null> };

export function FooterSection({ footerRef }: FooterSectionProps) {
  return (
    <footer ref={footerRef} className="mt-28 border-t border-white/10 bg-[#07081f] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div data-reveal className="sm:col-span-2 lg:col-span-1">
            <Link href="/">
              <div className="flex flex-col leading-none cursor-pointer hover:opacity-80 transition">
                <span className="text-2xl font-bold text-white">
                  Aus<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Drive</span>
                </span>
                <span className="mt-1 text-[9px] tracking-[0.25em] text-white/30 uppercase">Australia&apos;s Finest Fleet</span>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/40">
              Australia&apos;s most trusted car rental platform — premium vehicles, transparent pricing, and nationwide coverage.
            </p>
            <div className="mt-5 flex gap-3">
              {[Globe, Send, Mail].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-cyan-500/50 hover:text-cyan-400">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div data-reveal>
            <h5 className="font-semibold text-white">Quick Links</h5>
            <ul className="mt-4 space-y-2 text-sm text-white/40">
              <li><Link href="/cars" className="transition hover:text-cyan-400">Browse Fleet</Link></li>
              <li><Link href="/deals" className="transition hover:text-cyan-400">Hot Deals</Link></li>
              <li><Link href="/locations" className="transition hover:text-cyan-400">Locations</Link></li>
              <li><a href="#" className="transition hover:text-cyan-400">About Us</a></li>
              <li><a href="#" className="transition hover:text-cyan-400">FAQs</a></li>
              <li><a href="#" className="transition hover:text-cyan-400">Careers</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div data-reveal>
            <h5 className="font-semibold text-white">Contact Us</h5>
            <ul className="mt-4 space-y-3 text-sm text-white/40">
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 flex-none text-cyan-400" /><a href="mailto:support@ausdrive.com.au" className="hover:text-cyan-400 transition">support@ausdrive.com.au</a></li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 flex-none text-cyan-400" /><a href="tel:+61180000000" className="hover:text-cyan-400 transition">+61 1800 000 000</a></li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 flex-none text-cyan-400" /><Link href="/contact" className="hover:text-cyan-400 transition">Sydney, NSW 2000</Link></li>
              <li className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 flex-none text-cyan-400" /><Link href="/locations" className="hover:text-cyan-400 transition">60+ locations nationwide</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div data-reveal>
            <h5 className="font-semibold text-white">Stay Updated</h5>
            <p className="mt-2 text-sm text-white/40">Get exclusive deals and travel tips.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
              />
              <button className="flex-none rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2.5">
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/25">
          © 2023 AusDrive Pty Ltd. All rights reserved. · ABN 00 000 000 000 · Australia Only
        </div>
      </div>
    </footer>
  );
}
