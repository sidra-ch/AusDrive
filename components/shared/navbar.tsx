"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setBgOpacity(Math.min(scrollY / 72, 1));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/cars" },
    { label: "Locations", href: "/locations" },
    { label: "Deals", href: "/deals" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        backgroundColor: `rgba(6, 7, 26, ${bgOpacity * 0.94})`,
        borderBottom: `1px solid rgba(255, 255, 255, ${bgOpacity * 0.07})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500" />
            <span className="text-lg font-bold text-white">AusDrive</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-cyan-400"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white/70 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-cyan-400"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-white/10 pt-4">
              <Link
                href="/auth/login"
                className="block py-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="mt-2 block rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 py-2 text-center text-sm font-bold text-white transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
