"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Bell, Car, CalendarCheck,
  ClipboardList, CreditCard, Home, Key, LogOut,
  Map, Settings, Shield, Users, Wrench, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { group: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const nav: NavEntry[] = [
  { label: "Overview", href: "/dashboard", icon: Home },
  {
    group: "Fleet",
    items: [
      { label: "Manage Cars", href: "/dashboard/cars", icon: Car },
      { label: "Tracking", href: "/dashboard/tracking/live-map", icon: Map },
      { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Customers", href: "/dashboard/customers", icon: Users },
      { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
      { label: "Rentals", href: "/dashboard/rentals", icon: Key },
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "Analytics", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ClipboardList },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Users", href: "/dashboard/users", icon: Shield },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

function isNavItem(entry: NavEntry): entry is NavItem {
  return "href" in entry;
}

type SidebarProps = { open: boolean; onClose: () => void };

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = item.href === "/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
          active
            ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border border-cyan-500/20 text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("h-4 w-4 flex-none", active ? "text-cyan-400" : "")} />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-300 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex flex-col leading-none">
            <span className="text-lg font-bold text-foreground">
              Fleet<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Rent</span>
              <span className="ml-1 text-sm font-normal text-muted-foreground">Pro</span>
            </span>
            <span className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Admin Dashboard</span>
          </Link>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground lg:hidden transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map((entry, i) => {
            if (isNavItem(entry)) {
              return <NavLink key={i} item={entry} />;
            }
            return (
              <div key={entry.group} className="pt-4">
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {entry.group}
                </p>
                <div className="space-y-0.5">
                  {entry.items.map((sub) => <NavLink key={sub.href} item={sub} />)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-muted px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Admin User</p>
              <p className="truncate text-xs text-muted-foreground">admin@ausdrive.com.au</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
