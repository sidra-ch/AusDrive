"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import type { NotificationPayload } from "@/lib/socket";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifications.length;

  const { socket } = useSocket({
    onNotification: (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 20));
    },
  });

  // Load persisted notifications on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.notifications)) {
          setNotifications(data.notifications.slice(0, 20));
        }
      })
      .catch(() => {/* silently ignore */});
  }, []);

  // Suppress unused warning — socket is kept for side-effects only
  void socket;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-300" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-gray-900 shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                  <p className="text-sm font-medium text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
