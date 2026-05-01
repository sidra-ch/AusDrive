/**
 * AusDrive Mobile — Shared TypeScript Types
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'USER' | 'STAFF' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  branch?: string;
  profileImage?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  kycStatus?: KycStatus;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface KycDocument {
  id: string;
  type: 'license_front' | 'license_back' | 'selfie' | 'passport';
  url: string;
  status: KycStatus;
  rejectionReason?: string;
  createdAt: string;
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  plate: string;
  category: string;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  daily_rate: string | number;
  colour?: string;
  image_url?: string;
  images?: string[];
  seats?: number;
  transmission?: 'automatic' | 'manual';
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  rating?: number;
  branch?: string;
  location?: string;
  features?: string[];
  description?: string;
}

export interface CarFilters {
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  transmission?: string;
  seats?: number;
  fuelType?: string;
  location?: string;
  pickupDate?: string;
  dropoffDate?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface BookingAddon {
  type: 'insurance' | 'gps' | 'child_seat' | 'extra_driver';
  pricePerDay: number;
}

export interface PricingBreakdown {
  baseRate: number;
  days: number;
  subtotal: number;
  insuranceFee: number;
  addonsFee: number;
  depositAmount: number;
  promoDiscount: number;
  gstAmount: number;
  total: number;
}

export interface Booking {
  id: number;
  car_id: number;
  car_make?: string;
  car_model?: string;
  car_plate?: string;
  car_image?: string;
  customer_id?: string;
  customer_name?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  return_date: string;
  status: BookingStatus;
  total_amount?: number;
  payment_method?: 'card' | 'cash';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  addons?: BookingAddon[];
  cancellation_reason?: string;
  notes?: string;
  created_at?: string;
  invoice_url?: string;
}

export interface CreateBookingPayload {
  car_id: number | string;
  pickup_location: string;
  dropoff_location?: string;
  pickup_date: string;
  return_date: string;
  payment_method: 'card' | 'cash';
  addons?: string[];
  promo_code?: string;
  notes?: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  bookingId: number;
}

// ─── GPS / Tracking ──────────────────────────────────────────────────────────

export interface TrackedCar {
  car_id: number;
  booking_id?: number;
  make: string;
  model: string;
  plate: string;
  car_status: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  fuel_level: number;
  updated_at: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'booking' | 'payment' | 'reminder' | 'promotional' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ─── Support ─────────────────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
