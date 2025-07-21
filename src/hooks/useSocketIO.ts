import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config/environment';

interface UseSocketIOReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useSocketIO(url?: string): UseSocketIOReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (socket?.connected) return;

    setIsConnecting(true);
    setError(null);

    const socketUrl = config.SOCKET_URL || 'http://localhost:3001' || url
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket conectado');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          connect();
        }, 1000);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔌 Error de conexión:', err);
      setIsConnected(false);
      setIsConnecting(false);
      setError(err.message);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };
} 