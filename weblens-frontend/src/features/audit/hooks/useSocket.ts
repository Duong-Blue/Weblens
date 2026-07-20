import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (customUrl?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url = customUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      agent: false,
      upgrade: false,
      rejectUnauthorized: false
    });
    
    setTimeout(() => setSocket(socketInstance), 0);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [customUrl]);

  return socket;
};
