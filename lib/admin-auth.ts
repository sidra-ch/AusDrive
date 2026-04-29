export const DEFAULT_ALLOWED_ADMIN_DOMAINS = ["ausdrive.com", "ausdrive.com.au"];

export function normalizeRole(role: string | null | undefined): string {
  return String(role ?? "").trim().toUpperCase();
}

export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
}

export function isStrongPassword(password: string): boolean {
  // At least 8 chars with upper, lower, number, and symbol.
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export function getAllowedAdminDomains(): string[] {
  const envValue = process.env.ALLOWED_ADMIN_DOMAINS;
  if (!envValue) return DEFAULT_ALLOWED_ADMIN_DOMAINS;

  return envValue
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function emailDomain(email: string): string {
  return email.toLowerCase().split("@")[1] ?? "";
}

export function canUseAdminSignup(email: string, adminSecretKey?: string): boolean {
  const domainAllowed = getAllowedAdminDomains().includes(emailDomain(email));
  const expectedSecret = process.env.ADMIN_SIGNUP_SECRET?.trim();
  const secretAllowed = Boolean(expectedSecret) && expectedSecret === String(adminSecretKey ?? "").trim();
  return domainAllowed || secretAllowed;
}
