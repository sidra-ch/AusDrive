"use client";

import { cn } from "@/lib/utils";

// Stat card
export function StatCard({
  label, value, change, trend, icon: Icon,
}: {
  label: string; value: string; change: string; trend: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-xl hover:border-cyan-500/20 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/15 to-violet-500/15">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
      </div>
      <p className={cn("mt-3 text-xs font-medium",
        trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-muted-foreground"
      )}>
        {change} <span className="text-muted-foreground/60 font-normal">vs last period</span>
      </p>
    </div>
  );
}

// Section header
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

// Badge
export function Badge({ label, variant }: { label: string; variant: "success" | "danger" | "warning" | "info" | "neutral" }) {
  const styles = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    info: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    neutral: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[variant])}>
      {label}
    </span>
  );
}

// Table wrapper
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3.5 text-foreground/70 border-b border-border/50", className)}>
      {children}
    </td>
  );
}

// Card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

// Primary button
export function PrimaryBtn({ children, onClick, className, type = "button", disabled }: { children: React.ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit" | "reset"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_0_20px_rgba(99,102,241,0.3)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Ghost button
export function GhostBtn({ children, onClick, className, disabled }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Page wrapper
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 pb-6">{children}</div>;
}
