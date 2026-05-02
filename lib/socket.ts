import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { jwtVerify } from "jose";
import { requiredEnv } from "@/lib/env";

let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (!_secret) {
    _secret = new TextEncoder().encode(requiredEnv("JWT_SECRET"));
  }
  return _secret;
}

export type SocketUser = {
  sub: number;
  name: string;
  email: string;
  role: string;
};

export type BookingUpdatedPayload = {
  bookingId: number;
  status: string;
  updatedBy: string;
};

export type PaymentCompletedPayload = {
  paymentId: number;
  rentalId: number;
  amount: number;
  customerId: number;
};

export type NotificationPayload = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "booking" | "payment" | "system" | "promotional";
  createdAt: string;
};

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // JWT authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      // Try auth token from handshake
      const token =
        socket.handshake.auth?.token ??
        parseCookieToken(socket.handshake.headers.cookie);

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const { payload } = await jwtVerify(token, getSecret());
      socket.data.user = {
        sub: Number(payload.sub),
        name: payload.name as string,
        email: payload.email as string,
        role: payload.role as string,
      } satisfies SocketUser;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    // Join personal room
    socket.join(`user:${user.sub}`);

    // Admins join the admin room
    if (user.role === "admin" || user.role === "superadmin") {
      socket.join("admin");
    }

    // Client can join a specific booking room
    socket.on("booking:join", (bookingId: number) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("booking:leave", (bookingId: number) => {
      socket.leave(`booking:${bookingId}`);
    });

    socket.on("disconnect", () => {
      // cleanup handled automatically by Socket.io
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

/** Emit booking status change to the booking room and admins */
export function emitBookingUpdated(payload: BookingUpdatedPayload): void {
  if (!io) return;
  io.to(`booking:${payload.bookingId}`).to("admin").emit("booking:updated", payload);
}

/** Emit payment completed to the customer and admins */
export function emitPaymentCompleted(payload: PaymentCompletedPayload): void {
  if (!io) return;
  io.to(`user:${payload.customerId}`).to("admin").emit("payment:completed", payload);
}

/** Emit a notification to a specific user */
export function emitNotification(payload: NotificationPayload): void {
  if (!io) return;
  io.to(`user:${payload.userId}`).emit("notification:new", payload);
}

/** Emit admin dashboard refresh trigger */
export function emitAdminDashboardUpdate(): void {
  if (!io) return;
  io.to("admin").emit("admin:dashboard_update");
}

/** Parse the auth_token cookie from the Cookie header */
function parseCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
