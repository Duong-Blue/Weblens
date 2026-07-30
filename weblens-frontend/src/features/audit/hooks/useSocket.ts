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
      path: '/socket.io', // Ensure standard socket.io path is used
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [customUrl]);

  return socket;
};
