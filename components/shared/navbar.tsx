"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
  const isDark = theme === "dark";

  useEffect(() => {
    const onDocClick = () => setUserMenuOpen(false);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        backgroundColor: isDark
          ? `rgba(6, 7, 26, ${bgOpacity * 0.94})`
          : `rgba(255, 255, 255, ${bgOpacity * 0.94})`,
        borderBottom: isDark
          ? `1px solid rgba(255, 255, 255, ${bgOpacity * 0.07})`
          : `1px solid rgba(15, 23, 42, ${bgOpacity * 0.09})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500" />
            <span className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>AusDrive</span>
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
                    : isDark
                      ? "text-white/70 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-medium transition ${isDark ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-cyan-500/50"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-xs font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className={isDark ? "text-white" : "text-slate-800"}>{user?.name ?? "User"}</span>
                </button>

                {userMenuOpen && (
                  <div
                    className={`absolute right-0 z-50 mt-2 w-48 rounded-xl border p-2 shadow-xl ${
                      isDark ? "border-white/15 bg-[#0b0d24]" : "border-slate-200 bg-white"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href="/dashboard"
                      className={`block rounded-lg px-3 py-2 text-sm ${isDark ? "text-white/80 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
                        isDark ? "text-rose-300 hover:bg-rose-500/15" : "text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={`h-6 w-6 ${isDark ? "text-white" : "text-slate-900"}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isDark ? "text-white" : "text-slate-900"}`} />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className={`py-4 md:hidden ${isDark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-cyan-400"
                    : isDark
                      ? "text-white/70 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className={`mt-4 pt-4 ${isDark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
              <div className="mb-2">
                <ThemeToggle />
              </div>
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className={`block py-2 text-sm font-medium transition ${isDark ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {isAuthenticated ? "Dashboard" : "Login"}
              </Link>
              {!isAuthenticated ? (
                <Link
                  href="/signup"
                  className="mt-2 block rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 py-2 text-center text-sm font-bold text-white transition"
                >
                  Sign Up
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 block w-full rounded-lg bg-rose-500/90 py-2 text-center text-sm font-bold text-white transition"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
