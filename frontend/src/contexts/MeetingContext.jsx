import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSocket } from './SocketContext';

const MeetingContext = createContext();

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

if (import.meta.env.VITE_TURN_URL) {
  iceServers.push({
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  });
}

const rtcConfig = { iceServers };

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children, meetingId, user }) => {
  const { socket, isConnected, connectionError } = useSocket();
  const [localStream, setLocalStreamState] = useState(null);
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
  const [meetingConnectionError, setMeetingConnectionError] = useState('');

  const peerConnections = useRef(new Map());
  const pendingIceCandidates = useRef(new Map());
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatContainerRef = useRef(null);
  const isChatOpenRef = useRef(false);
  const isHostRef = useRef(false);
  const leaveMeetingRef = useRef(() => {});

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const setLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
    setLocalStreamState(stream);
    setIsAudioEnabled(stream?.getAudioTracks()[0]?.enabled ?? false);
    setIsVideoEnabled(stream?.getVideoTracks()[0]?.enabled ?? false);
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const addParticipant = useCallback((socketId, remoteUser) => {
    if (!socketId || !remoteUser) return;

    setParticipants((current) => {
      const participant = { ...remoteUser, socketId };
      const existingIndex = current.findIndex((item) => item.socketId === socketId);
      if (existingIndex === -1) {
        return [...current, participant];
      }

      return current.map((item, index) => index === existingIndex ? participant : item);
    });
  }, []);

  const cleanupPeerConnection = useCallback((socketId) => {
    const peerConnection = peerConnections.current.get(socketId);
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
      peerConnections.current.delete(socketId);
    }

    pendingIceCandidates.current.delete(socketId);
    setRemoteStreams((current) => {
      const next = new Map(current);
      next.delete(socketId);
      return next;
    });
  }, []);

  const flushIceCandidates = useCallback(async (socketId, peerConnection) => {
    const candidates = pendingIceCandidates.current.get(socketId) || [];
    pendingIceCandidates.current.delete(socketId);

    for (const candidate of candidates) {
      await peerConnection.addIceCandidate(candidate);
    }
  }, []);

  const createPeerConnection = useCallback(async (remoteSocketId, remoteUser, initiator) => {
    const existing = peerConnections.current.get(remoteSocketId);
    if (existing) return existing;

    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (!socket || !currentStream) return null;

    const peerConnection = new RTCPeerConnection(rtcConfig);
    currentStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, currentStream);
    });

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      setRemoteStreams((current) => {
        const next = new Map(current);
        next.set(remoteSocketId, remoteStream);
        return next;
      });
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('signal-ice', {
        toSocketId: remoteSocketId,
        candidate: event.candidate,
      });
    };

    peerConnection.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peerConnection.connectionState)) {
        cleanupPeerConnection(remoteSocketId);
      }
    };

    peerConnections.current.set(remoteSocketId, peerConnection);
    addParticipant(remoteSocketId, remoteUser);

    if (initiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('signal-offer', {
        toSocketId: remoteSocketId,
        offer: peerConnection.localDescription,
      });
    }

    return peerConnection;
  }, [addParticipant, cleanupPeerConnection, socket]);

  useEffect(() => {
    if (isConnected) return;

    for (const socketId of Array.from(peerConnections.current.keys())) {
      cleanupPeerConnection(socketId);
    }
    setParticipants([]);
    setActiveScreenSharer(null);
  }, [cleanupPeerConnection, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected || !localStream) return undefined;

    let active = true;

    const handleRoomParticipants = async ({ participants: roomParticipants = [] }) => {
      for (const participant of roomParticipants) {
        if (!active) return;
        await createPeerConnection(participant.socketId, participant.user, true);
      }
    };

    const handleUserJoined = ({ socketId, user: remoteUser }) => {
      addParticipant(socketId, remoteUser);
    };

    const handleUserLeft = ({ socketId }) => {
      setParticipants((current) => current.filter((item) => item.socketId !== socketId));
      cleanupPeerConnection(socketId);
      setActiveScreenSharer((current) => current?.socketId === socketId ? null : current);
    };

    const handleOffer = async ({ fromSocketId, fromUser, offer }) => {
      try {
        const peerConnection = await createPeerConnection(fromSocketId, fromUser, false);
        if (!peerConnection) return;

        if (peerConnection.signalingState !== 'stable') {
          await peerConnection.setLocalDescription({ type: 'rollback' });
        }

        await peerConnection.setRemoteDescription(offer);
        await flushIceCandidates(fromSocketId, peerConnection);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal-answer', {
          toSocketId: fromSocketId,
          answer: peerConnection.localDescription,
        });
      } catch (error) {
        console.error('Unable to accept peer offer:', error);
        cleanupPeerConnection(fromSocketId);
      }
    };

    const handleAnswer = async ({ fromSocketId, answer }) => {
      const peerConnection = peerConnections.current.get(fromSocketId);
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(answer);
        await flushIceCandidates(fromSocketId, peerConnection);
      } catch (error) {
        console.error('Unable to accept peer answer:', error);
        cleanupPeerConnection(fromSocketId);
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      if (!candidate) return;
      const peerConnection = peerConnections.current.get(fromSocketId);

      if (!peerConnection || !peerConnection.remoteDescription) {
        const queued = pendingIceCandidates.current.get(fromSocketId) || [];
        pendingIceCandidates.current.set(fromSocketId, [...queued, candidate]);
        return;
      }

      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Unable to add ICE candidate:', error);
      }
    };

    const handleMeetingEnded = ({ message }) => {
      window.alert(message || 'The meeting has ended.');
      leaveMeetingRef.current();
    };

    const handleChatMessage = (message) => {
      setChatMessages((current) => [...current, message]);
      if (!isChatOpenRef.current) {
        setUnreadMessages((current) => current + 1);
      }
    };

    const handleChatHistory = ({ messages = [] }) => setChatMessages(messages);
    const handleScreenShareStarted = (data) => setActiveScreenSharer(data);
    const handleScreenShareStopped = ({ socketId }) => {
      setActiveScreenSharer((current) => current?.socketId === socketId ? null : current);
    };

    const listeners = {
      'room-participants': handleRoomParticipants,
      'user-joined': handleUserJoined,
      'user-left': handleUserLeft,
      'signal-offer': handleOffer,
      'signal-answer': handleAnswer,
      'signal-ice': handleIceCandidate,
      'meeting-ended': handleMeetingEnded,
      'receive-chat-message': handleChatMessage,
      'chat-history': handleChatHistory,
      'screen-share-started': handleScreenShareStarted,
      'screen-share-stopped': handleScreenShareStopped,
    };

    Object.entries(listeners).forEach(([event, handler]) => socket.on(event, handler));

    socket.emit('join-room', {
      meetingId,
      user: { name: user?.name || 'Guest' },
    }, (response) => {
      if (!active) return;
      if (!response?.success) {
        setMeetingConnectionError(response?.message || 'Unable to join this meeting');
        return;
      }

      setMeetingConnectionError('');
      setIsHost(Boolean(response.self?.isHost));
      socket.emit('get-chat-history', { meetingId });
    });

    return () => {
      active = false;
      Object.entries(listeners).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [
    addParticipant,
    cleanupPeerConnection,
    createPeerConnection,
    flushIceCandidates,
    isConnected,
    localStream,
    meetingId,
    socket,
    user?.name,
  ]);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const currentScreenStream = screenStreamRef.current;
    if (!currentScreenStream) return;

    currentScreenStream.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);

    const cameraStream = localStreamRef.current;
    if (cameraStream) {
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      const microphoneTrack = cameraStream.getAudioTracks()[0];

      for (const peerConnection of peerConnections.current.values()) {
        const videoSender = peerConnection.getSenders().find((sender) => sender.track?.kind === 'video');
        const audioSender = peerConnection.getSenders().find((sender) => sender.track?.kind === 'audio');
        if (videoSender && cameraVideoTrack) await videoSender.replaceTrack(cameraVideoTrack);
        if (audioSender && microphoneTrack) await audioSender.replaceTrack(microphoneTrack);
      }
    }

    socket?.emit('stop-screen-share', { meetingId });
  }, [meetingId, socket]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      for (const peerConnection of peerConnections.current.values()) {
        const videoSender = peerConnection.getSenders().find((sender) => sender.track?.kind === 'video');
        const audioSender = peerConnection.getSenders().find((sender) => sender.track?.kind === 'audio');
        if (videoSender && videoTrack) await videoSender.replaceTrack(videoTrack);
        if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
      }

      videoTrack.onended = () => stopScreenShare();
      socket?.emit('start-screen-share', { meetingId });
    } catch (error) {
      if (error.name !== 'NotAllowedError') {
        window.alert('Unable to start screen sharing.');
      }
    }
  }, [meetingId, socket, stopScreenShare]);

  const sendChatMessage = useCallback((message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !socket) return;
    socket.emit('send-chat-message', { meetingId, message: trimmedMessage });
  }, [meetingId, socket]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((current) => {
      if (!current) setUnreadMessages(0);
      return !current;
    });
  }, []);

  const leaveMeeting = useCallback(() => {
    socket?.emit('user-leaving');

    for (const peerConnection of peerConnections.current.values()) {
      peerConnection.close();
    }
    peerConnections.current.clear();
    pendingIceCandidates.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    window.location.assign(user ? '/' : '/login');
  }, [socket, user]);

  useEffect(() => {
    leaveMeetingRef.current = leaveMeeting;
  }, [leaveMeeting]);

  const endMeeting = useCallback(() => {
    if (!socket || !isHostRef.current) return;

    socket.emit('host-end-meeting', { meetingId }, (response) => {
      if (!response?.success) {
        window.alert(response?.message || 'Unable to end this meeting.');
      }
    });
  }, [meetingId, socket]);

  useEffect(() => {
    const connections = peerConnections.current;
    const pendingCandidates = pendingIceCandidates.current;

    return () => {
      for (const peerConnection of connections.values()) {
        peerConnection.close();
      }
      connections.clear();
      pendingCandidates.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const value = {
    activeScreenSharer,
    chatContainerRef,
    chatMessages,
    connectionError: meetingConnectionError || connectionError,
    endMeeting,
    isAudioEnabled,
    isChatOpen,
    isHost,
    isScreenSharing,
    isVideoEnabled,
    leaveMeeting,
    localStream,
    localVideoRef,
    participants,
    remoteStreams,
    screenStream,
    sendChatMessage,
    setLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleAudio,
    toggleChat,
    toggleVideo,
    unreadMessages,
  };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};
