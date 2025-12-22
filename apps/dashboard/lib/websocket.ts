import type { Socket } from 'socket.io-client';
import type { Lead } from '@/types/lead';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Lazy load socket.io-client only on client side
function getIO() {
  if (typeof window === 'undefined') {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('socket.io-client').io;
}

export class LeadsWebSocket {
  private socket: Socket | null = null;

  connect() {
    // Only connect on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    const io = getIO();
    if (!io) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
    });

    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onLeadCreated(callback: (lead: Lead) => void) {
    if (typeof window === 'undefined') {
      return;
    }
    if (!this.socket) {
      this.connect();
    }
    // Use setTimeout to ensure socket is ready
    setTimeout(() => {
      this.socket?.on('lead:created', callback);
    }, 100);
  }

  onLeadUpdated(callback: (lead: Lead) => void) {
    if (typeof window === 'undefined') {
      return;
    }
    if (!this.socket) {
      this.connect();
    }
    // Use setTimeout to ensure socket is ready
    setTimeout(() => {
      this.socket?.on('lead:updated', callback);
    }, 100);
  }

  offLeadCreated(callback: (lead: Lead) => void) {
    if (this.socket) {
      this.socket.off('lead:created', callback);
    }
  }

  offLeadUpdated(callback: (lead: Lead) => void) {
    if (this.socket) {
      this.socket.off('lead:updated', callback);
    }
  }
}
