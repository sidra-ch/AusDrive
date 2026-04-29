"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket-client";
import type {
  BookingUpdatedPayload,
  NotificationPayload,
  PaymentCompletedPayload,
} from "@/lib/socket";

type SocketCallbacks = {
  onBookingUpdated?: (payload: BookingUpdatedPayload) => void;
  onPaymentCompleted?: (payload: PaymentCompletedPayload) => void;
  onNotification?: (payload: NotificationPayload) => void;
  onAdminDashboardUpdate?: () => void;
};

export function useSocket(callbacks: SocketCallbacks = {}) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callback refs up-to-date without re-connecting
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const joinBooking = useCallback((bookingId: number) => {
    socketRef.current?.emit("booking:join", bookingId);
  }, []);

  const leaveBooking = useCallback((bookingId: number) => {
    socketRef.current?.emit("booking:leave", bookingId);
  }, []);

  useEffect(() => {
    const s = connectSocket();
    socketRef.current = s;

    s.on("booking:updated", (p: BookingUpdatedPayload) =>
      callbacksRef.current.onBookingUpdated?.(p)
    );
    s.on("payment:completed", (p: PaymentCompletedPayload) =>
      callbacksRef.current.onPaymentCompleted?.(p)
    );
    s.on("notification:new", (p: NotificationPayload) =>
      callbacksRef.current.onNotification?.(p)
    );
    s.on("admin:dashboard_update", () =>
      callbacksRef.current.onAdminDashboardUpdate?.()
    );

    return () => {
      s.off("booking:updated");
      s.off("payment:completed");
      s.off("notification:new");
      s.off("admin:dashboard_update");
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { socket: socketRef.current, joinBooking, leaveBooking };
}
