import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

function isRealtimeEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_REALTIME;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Returns the singleton Socket.io client, creating it on first call.
 * Pass the JWT token so the server middleware can authenticate the connection.
 */
export function getSocket(token?: string): Socket | null {
  if (!isRealtimeEnabled()) return null;
  if (socket?.connected) return socket;

  socket = io({
    path: "/api/socket",
    auth: token ? { token } : undefined,
    withCredentials: true,       // sends cookies too (auth_token)
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  return socket;
}

export function connectSocket(token?: string): Socket | null {
  const s = getSocket(token);
  if (!s) return null;
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
