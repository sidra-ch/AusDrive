import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

// The socket server runs on the same port as the API
const SOCKET_URL = API_URL;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        this.handleConnectionFailure();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      this.handleConnectionFailure();
    });
  }

  private handleConnectionFailure() {
    console.error('[Socket] Connection failed - check network connection');
    // Could emit a global event for the app to handle
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen to event - not connected');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) {
      console.warn('[Socket] Cannot remove listener - not connected');
      return;
    }
    
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot emit event - not connected');
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'reconnecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'disconnected'; // Simplified for TypeScript compatibility
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  // Method to track specific cars
  trackCar(carId: string) {
    return this.emit('track_car', { carId });
  }

  untrackCar(carId: string) {
    return this.emit('untrack_car', { carId });
  }
}

export const socketService = new SocketService();
