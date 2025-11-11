import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const MeetingContext = createContext();

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children, meetingId, user }) => {
  const { socket, isConnected } = useSocket();
  const { user: authUser } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [screenStream, setScreenStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeScreenSharer, setActiveScreenSharer] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const peerConnections = useRef(new Map());
  const localVideoRef = useRef();
  const screenStreamRef = useRef();
  const chatContainerRef = useRef();

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.chathelp.ru:3478' },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Check if user is host when component mounts
  useEffect(() => {
    const checkHostStatus = async () => {
      try {
        const { meetingsAPI } = await import('../api/meetings');
        const response = await meetingsAPI.getMeeting(meetingId);
        const meeting = response.data.data;
        
        if (meeting && authUser) {
          const userIsHost = meeting.hostId === authUser._id;
          setIsHost(userIsHost);
          console.log('👑 Host status:', userIsHost ? 'User is HOST' : 'User is participant');
        }
      } catch (error) {
        console.error('Error checking host status:', error);
      }
    };

    checkHostStatus();
  }, [meetingId, authUser]);

  // Sync local stream with video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('🎥 Setting local video stream');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup WebRTC when socket and local stream are ready
  useEffect(() => {
    if (socket && localStream && isConnected) {
      console.log('🚀 Setting up WebRTC signaling');
      setupWebRTCSignaling();
    }
  }, [socket, localStream, isConnected]);

  const setupWebRTCSignaling = () => {
    // Remove any existing listeners to avoid duplicates
    socket.off('user-joined');
    socket.off('user-left');
    socket.off('signal-offer');
    socket.off('signal-answer');
    socket.off('signal-ice');
    socket.off('meeting-ended');
    socket.off('receive-chat-message');
    socket.off('chat-history');
    socket.off('screen-share-started');
    socket.off('screen-share-stopped');

    // Setup new listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('signal-offer', handleOffer);
    socket.on('signal-answer', handleAnswer);
    socket.on('signal-ice', handleIceCandidate);
    socket.on('meeting-ended', handleMeetingEnded);
    socket.on('receive-chat-message', handleChatMessage);
    socket.on('chat-history', handleChatHistory);
    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);

    // Load chat history
    socket.emit('get-chat-history', { meetingId });
  };

  const handleUserJoined = async (data) => {
    console.log('🔄 User joined:', data.user.name, 'Host:', data.user.isHost, 'socket:', data.socketId);
    const { socketId: remoteSocketId, user: remoteUser } = data;
    
    // Add to participants list with host status
    setParticipants(prev => {
      const exists = prev.find(p => p.socketId === remoteSocketId);
      if (!exists) {
        return [...prev, { 
          ...remoteUser, 
          socketId: remoteSocketId,
          isHost: remoteUser.isHost || false 
        }];
      }
      return prev;
    });
    
    // Create peer connection for the new user (we initiate the offer)
    await createPeerConnection(remoteSocketId, remoteUser, true);
  };

  const handleUserLeft = (data) => {
    console.log('🔄 User left:', data.user?.name, 'socket:', data.socketId);
    const { socketId: remoteSocketId } = data;
    
    // Remove from participants
    setParticipants(prev => prev.filter(p => p.socketId !== remoteSocketId));
    
    // Clean up peer connection and remove video
    cleanupPeerConnection(remoteSocketId);
  };

  const handleMeetingEnded = (data) => {
    console.log('📢 Meeting ended by host');
    alert(data?.message || 'The host has ended the meeting.');
    leaveMeeting();
  };

  const createPeerConnection = useCallback(async (remoteSocketId, remoteUser, isInitiator = false) => {
    try {
      console.log('🔗 Creating peer connection for:', remoteUser.name, 'initiator:', isInitiator);
      
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Add current tracks to the connection (could be camera or screen share)
      let currentStream = isScreenSharing ? screenStreamRef.current : localStream;
      
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          console.log('➕ Adding track:', track.kind);
          pc.addTrack(track, currentStream);
        });
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log('🎥 Received remote track from:', remoteUser.name);
        const [remoteStream] = event.streams;
        if (remoteStream) {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(remoteSocketId, remoteStream);
            console.log('📊 Remote streams count:', newMap.size);
            return newMap;
          });
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to:', remoteSocketId);
          socket.emit('signal-ice', {
            toSocketId: remoteSocketId,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`🔗 Connection state for ${remoteUser.name}:`, pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ Successfully connected to:', remoteUser.name);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log('❌ Connection failed with:', remoteUser.name);
          cleanupPeerConnection(remoteSocketId);
        }
      };

      peerConnections.current.set(remoteSocketId, pc);

      // If we're the initiator, create an offer
      if (isInitiator) {
        setTimeout(() => createOffer(pc, remoteSocketId, remoteUser), 1000);
      }

      return pc;

    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
    }
  }, [localStream, isScreenSharing, socket]);

  const createOffer = async (pc, remoteSocketId, remoteUser) => {
    try {
      console.log('📤 Creating offer for:', remoteUser.name);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('📨 Sending offer to:', remoteSocketId);
      socket.emit('signal-offer', {
        toSocketId: remoteSocketId,
        fromUser: {
          ...user,
          isHost: isHost
        },
        offer: pc.localDescription
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const handleOffer = async (data) => {
    const { fromUser, offer, fromSocketId } = data;
    console.log('📥 Received offer from:', fromUser.name, 'Host:', fromUser.isHost, 'socket:', fromSocketId);

    try {
      // Check if we already have a connection for this user
      let pc = peerConnections.current.get(fromSocketId);
      
      if (!pc) {
        console.log('🆕 Creating new peer connection for offer');
        pc = await createPeerConnection(fromSocketId, fromUser, false);
      }

      if (pc) {
        console.log('🤝 Setting remote description (offer)');
        await pc.setRemoteDescription(offer);
        
        console.log('📤 Creating answer');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log('📨 Sending answer to:', fromSocketId);
        socket.emit('signal-answer', {
          toSocketId: fromSocketId,
          fromUser: {
            ...user,
            isHost: isHost
          },
          answer: pc.localDescription
        });
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    const { fromUser, answer, fromSocketId } = data;
    console.log('📥 Received answer from:', fromUser.name, 'Host:', fromUser.isHost, 'socket:', fromSocketId);
    
    const pc = peerConnections.current.get(fromSocketId);
    if (pc) {
      try {
        console.log('🤝 Setting remote description (answer)');
        await pc.setRemoteDescription(answer);
        console.log('✅ Answer processed successfully');
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    } else {
      console.error('❌ No peer connection found for answer from:', fromSocketId);
    }
  };

  const handleIceCandidate = async (data) => {
    const { candidate, fromSocketId } = data;
    console.log('🧊 Received ICE candidate from:', fromSocketId);
    
    const pc = peerConnections.current.get(fromSocketId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('✅ ICE candidate added');
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    }
  };

  const cleanupPeerConnection = (socketId) => {
    console.log('🧹 Cleaning up peer connection for:', socketId);
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });
  };

  // Screen Sharing Functions
  const startScreenShare = async () => {
    try {
      console.log('🖥️ Starting screen share...');
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { max: 1920 },
          height: { max: 1080 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      screenStreamRef.current = screenStream;
      setScreenStream(screenStream);
      setIsScreenSharing(true);

      // Notify other participants
      socket.emit('start-screen-share', {
        meetingId,
        user: {
          ...user,
          isHost
        }
      });

      // Replace video track in all peer connections
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      const screenAudioTrack = screenStream.getAudioTracks()[0];
      
      peerConnections.current.forEach((pc, socketId) => {
        // Replace video track
        const videoSender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (videoSender && screenVideoTrack) {
          videoSender.replaceTrack(screenVideoTrack);
        }

        // Add or replace audio track if screen sharing has audio
        if (screenAudioTrack) {
          const audioSender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'audio'
          );
          if (audioSender) {
            audioSender.replaceTrack(screenAudioTrack);
          } else {
            pc.addTrack(screenAudioTrack, screenStream);
          }
        }
      });

      // Handle when user stops screen share via browser UI
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      if (screenAudioTrack) {
        screenAudioTrack.onended = () => {
          stopScreenShare();
        };
      }

      console.log('✅ Screen share started successfully');

    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      if (error.name !== 'NotAllowedError') {
        alert('Failed to start screen sharing. Please try again.');
      }
    }
  };

  const stopScreenShare = async () => {
    try {
      console.log('🖥️ Stopping screen share...');

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      setScreenStream(null);
      setIsScreenSharing(false);

      // Notify other participants
      socket.emit('stop-screen-share', {
        meetingId,
        user: {
          ...user,
          isHost
        }
      });

      // Restore camera and microphone tracks in all peer connections
      if (localStream) {
        const cameraVideoTrack = localStream.getVideoTracks()[0];
        const microphoneAudioTrack = localStream.getAudioTracks()[0];
        
        peerConnections.current.forEach((pc) => {
          // Restore video track
          const videoSender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (videoSender && cameraVideoTrack) {
            videoSender.replaceTrack(cameraVideoTrack);
          }

          // Restore audio track
          const audioSender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'audio'
          );
          if (audioSender && microphoneAudioTrack) {
            audioSender.replaceTrack(microphoneAudioTrack);
          }
        });
      }

      console.log('✅ Screen share stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
    }
  };

  const handleScreenShareStarted = (data) => {
    console.log('🖥️ Remote screen share started by:', data.user.name);
    setActiveScreenSharer(data);
  };

  const handleScreenShareStopped = (data) => {
    console.log('🖥️ Remote screen share stopped by:', data.user.name);
    setActiveScreenSharer(null);
  };

  // Chat Functions
  const sendChatMessage = (message) => {
    if (!message.trim()) return;

    const chatData = {
      meetingId,
      sender: {
        id: user?.id || null,
        name: user?.name || 'Guest',
        isHost
      },
      message: message.trim()
    };

    socket.emit('send-chat-message', chatData);
  };

  const handleChatMessage = (data) => {
    console.log('💬 Received chat message:', data);
    setChatMessages(prev => [...prev, data]);
    
    // Increment unread count if chat is closed
    if (!isChatOpen) {
      setUnreadMessages(prev => prev + 1);
    }
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleChatHistory = (data) => {
    console.log('📜 Loaded chat history:', data.messages.length, 'messages');
    setChatMessages(data.messages);
  };

  const toggleChat = () => {
    if (!isChatOpen) {
      // Reset unread count when opening chat
      setUnreadMessages(0);
    }
    setIsChatOpen(prev => !prev);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('🎤 Audio', audioTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('📹 Video', videoTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  };

  const endMeeting = async () => {
    if (isHost) {
      console.log('👑 Host is ending the meeting');
      
      // Notify all participants
      socket.emit('host-end-meeting', { meetingId });
    }
    leaveMeeting();
  };

  const leaveMeeting = () => {
    console.log('👋 Leaving meeting, cleaning up connections');
    
    // Notify others that we're leaving
    socket.emit('user-leaving', { 
      meetingId, 
      userId: authUser?._id 
    });
    
    // Clean up all peer connections
    peerConnections.current.forEach((pc, socketId) => {
      cleanupPeerConnection(socketId);
    });
    
    // Stop local stream and screen share
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear all state
    setRemoteStreams(new Map());
    setParticipants([]);
    setChatMessages([]);
    setUnreadMessages(0);
    
    // Navigate away
    window.location.href = '/';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnections.current.forEach((pc, socketId) => {
        pc.close();
      });
    };
  }, [localStream]);

  return (
    <MeetingContext.Provider value={{
      // Video & Audio
      localStream,
      setLocalStream,
      remoteStreams,
      isAudioEnabled,
      isVideoEnabled,
      localVideoRef,
      toggleAudio,
      toggleVideo,
      
      // Screen Sharing
      screenStream,
      isScreenSharing,
      activeScreenSharer,
      startScreenShare,
      stopScreenShare,
      
      // Participants & Host
      participants,
      isHost,
      
      // Chat
      chatMessages,
      isChatOpen,
      unreadMessages,
      chatContainerRef,
      sendChatMessage,
      toggleChat,
      
      // Meeting Controls
      leaveMeeting,
      endMeeting,
    }}>
      {children}
    </MeetingContext.Provider>
  );
};