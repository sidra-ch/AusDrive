const rateCache = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): { success: boolean } {
  const now = Date.now();
  const record = rateCache.get(ip);

  if (record) {
    if (now > record.expiresAt) {
      rateCache.set(ip, { count: 1, expiresAt: now + windowMs });
      return { success: true };
    }
    
    if (record.count >= limit) {
      return { success: false };
    }

    record.count += 1;
    rateCache.set(ip, record);
    return { success: true };
  } else {
    rateCache.set(ip, { count: 1, expiresAt: now + windowMs });
    return { success: true };
  }
}
