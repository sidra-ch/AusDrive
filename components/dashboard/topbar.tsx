"use client";

import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-muted-foreground hover:text-foreground lg:hidden transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cars, customers, rentals..."
            className="w-72 rounded-xl border border-input bg-muted py-2 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground md:block">
          🇦🇺 Sydney Branch
        </span>
        <ThemeToggle />
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
          A
        </div>
      </div>
    </header>
  );
}
