/**
 * Australia-locale formatting helpers
 */

/**
 * Format a number as AUD currency, e.g. $1,234.56
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date to e.g. "Mon 12 May 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a datetime string or Date to e.g. "12 May 2026, 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Return number of days between two dates (rounded up)
 */
export function daysBetween(from: string | Date, to: string | Date): number {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86_400_000));
}

/**
 * Calculate GST (10%) from a total that already includes GST
 */
export function extractGst(totalIncGst: number): number {
  return parseFloat((totalIncGst / 11).toFixed(2));
}

/**
 * Add GST (10%) on top of an ex-GST amount
 */
export function addGst(amount: number): number {
  return parseFloat((amount * 1.1).toFixed(2));
}

/**
 * Capitalise first letter
 */
export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert booking status to human-readable label
 */
export function formatBookingStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    payment_pending: 'Awaiting Payment',
    paid: 'Paid',
    confirmed: 'Confirmed',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] ?? capitalise(status);
}
