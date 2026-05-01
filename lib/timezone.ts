import { toZonedTime, fromZonedTime, format as tzFormat } from 'date-fns-tz';

const AUSTRALIA_TZ = 'Australia/Sydney';

export const AU_TZ = AUSTRALIA_TZ;

export function toAustraliaTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(d, AUSTRALIA_TZ);
}

export function fromAustraliaTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return fromZonedTime(d, AUSTRALIA_TZ);
}

export function formatAustraliaTime(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return tzFormat(toZonedTime(d, AUSTRALIA_TZ), formatStr, { timeZone: AUSTRALIA_TZ });
}

export function nowInAustralia(): Date {
  return toZonedTime(new Date(), AUSTRALIA_TZ);
}

export function parseAustraliaDateTime(dateStr: string, timeStr: string): Date {
  const localDate = new Date(`${dateStr}T${timeStr}`);
  return fromZonedTime(localDate, AUSTRALIA_TZ);
}

export function addBufferTime(date: Date, bufferMinutes: number): Date {
  return new Date(date.getTime() + bufferMinutes * 60 * 1000);
}

export function subtractBufferTime(date: Date, bufferMinutes: number): Date {
  return new Date(date.getTime() - bufferMinutes * 60 * 1000);
}

export function isWithinAustraliaBusinessHours(date: Date): boolean {
  const auTime = toZonedTime(date, AUSTRALIA_TZ);
  const hours = auTime.getHours();
  const day = auTime.getDay();

  if (day === 0 || day === 6) return false;
  return hours >= 8 && hours < 18;
}

export function getBookingDurationHours(pickup: Date, dropoff: Date): number {
  return (dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60);
}

export function getBookingDurationDays(pickup: Date, dropoff: Date): number {
  return Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
}

export function isDateInPast(date: Date): boolean {
  return date < new Date();
}

export function validateBookingDates(pickup: Date, dropoff: Date): { valid: boolean; error?: string } {
  if (pickup >= dropoff) {
    return { valid: false, error: 'Pickup date must be before dropoff date' };
  }

  if (pickup < new Date()) {
    return { valid: false, error: 'Pickup date cannot be in the past' };
  }

  const hours = getBookingDurationHours(pickup, dropoff);
  if (hours < 1) {
    return { valid: false, error: 'Minimum booking duration is 1 hour' };
  }

  const days = getBookingDurationDays(pickup, dropoff);
  if (days > 30) {
    return { valid: false, error: 'Maximum booking duration is 30 days' };
  }

  return { valid: true };
}
