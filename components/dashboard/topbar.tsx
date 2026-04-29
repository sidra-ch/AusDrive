"use client";

import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// For now, set unread count to 0 since we removed mock data
// In a real app, this would be fetched from an API
const unreadCount = 0;

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
        <button className="relative rounded-xl border border-input bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
          A
        </div>
      </div>
    </header>
  );
}
