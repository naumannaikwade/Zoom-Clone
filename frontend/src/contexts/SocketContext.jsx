import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, meetingId, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
        meetingId,
        user
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      
      // Join the meeting room
      newSocket.emit('join-room', {
        meetingId,
        user: {
          id: user?._id,
          name: user?.name,
          isGuest: !user
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // WebRTC signaling events
    newSocket.on('user-joined', (data) => {
      console.log('👤 User joined:', data);
      // This will be handled by MeetingContext
    });

    newSocket.on('user-left', (data) => {
      console.log('👤 User left:', data);
      // This will be handled by MeetingContext
    });

    newSocket.on('signal-offer', (data) => {
      console.log('📨 Received offer from:', data.fromUser.name);
      // This will be handled by MeetingContext
    });

    newSocket.on('signal-answer', (data) => {
      console.log('📨 Received answer from:', data.fromUser.name);
      // This will be handled by MeetingContext
    });

    newSocket.on('signal-ice', (data) => {
      console.log('🧊 Received ICE candidate');
      // This will be handled by MeetingContext
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [meetingId, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};