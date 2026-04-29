"use client";

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-border border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading Dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur-xl animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-muted mb-3" />
          <div className="h-8 w-32 rounded bg-muted" />
        </div>
        <div className="h-10 w-10 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3.5"><div className="h-4 w-12 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-32 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-40 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-20 rounded bg-muted" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-16 rounded bg-muted" /></td>
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-xl animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-40 rounded bg-muted mb-2" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="h-48 rounded bg-muted" />
    </div>
  );
}
