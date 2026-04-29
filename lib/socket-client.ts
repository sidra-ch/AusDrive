import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns the singleton Socket.io client, creating it on first call.
 * Pass the JWT token so the server middleware can authenticate the connection.
 */
export function getSocket(token?: string): Socket {
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

export function connectSocket(token?: string): Socket {
  const s = getSocket(token);
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
