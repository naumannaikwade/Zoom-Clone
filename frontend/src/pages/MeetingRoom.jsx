import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MeetingProvider, useMeeting } from '../contexts/MeetingContext';
import { meetingsAPI } from '../api/meetings';
import ChatPanel from '../components/ChatPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMicrophone,
    faMicrophoneSlash,
    faVideo,
    faVideoSlash,
    faDesktop,
    faStop,
    faCommentDots,
    faPhoneSlash,
    faPowerOff,
    faUser,
    faCopy,
    faShare,
} from '@fortawesome/free-solid-svg-icons';

const MeetingRoom = () => {
    const { id: meetingId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMeeting();
    }, [meetingId]);

    const loadMeeting = async () => {
        try {
            const response = await meetingsAPI.getMeeting(meetingId);
            setMeeting(response.data.data);
        } catch (err) {
            setError('Meeting not found or has ended');
            console.error('Failed to load meeting:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#232333] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d8cff] mx-auto mb-4"></div>
                    <p className="text-[#747487]">Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#232333] flex items-center justify-center">
                <div className="text-white text-center max-w-md mx-4">
                    <div className="w-16 h-16 bg-[#f26d21] rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faPowerOff} className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-white">Meeting Error</h1>
                    <p className="mb-6 text-[#747487]">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-[#2d8cff] hover:bg-[#1a7ae8] text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SocketProvider meetingId={meetingId} user={user}>
            <MeetingProvider meetingId={meetingId} user={user}>
                <MeetingRoomContent
                    meeting={meeting}
                    meetingId={meetingId}
                    user={user}
                />
            </MeetingProvider>
        </SocketProvider>
    );
};

const MeetingRoomContent = ({ meeting, meetingId, user }) => {
    const {
        localStream,
        setLocalStream,
        remoteStreams,
        isAudioEnabled,
        isVideoEnabled,
        participants,
        isHost,
        isScreenSharing,
        activeScreenSharer,
        localVideoRef,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        toggleChat,
        leaveMeeting,
        endMeeting,
        isChatOpen,
        unreadMessages
    } = useMeeting();

    const [permissionDenied, setPermissionDenied] = useState(false);
    const [deviceType, setDeviceType] = useState('desktop');
    const navigate = useNavigate();
    const remoteVideoRefs = useRef(new Map());

    // UPDATED: Corrected device detection with 770px breakpoint
    useEffect(() => {
        const checkDeviceType = () => {
            const width = window.innerWidth;
            if (width < 770) {
                setDeviceType('mobile');
            } else if (width >= 770 && width < 1024) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        };

        checkDeviceType();
        window.addEventListener('resize', checkDeviceType);

        return () => {
            window.removeEventListener('resize', checkDeviceType);
        };
    }, []);

    // Set host status based on meeting data
    useEffect(() => {
        if (meeting && user) {
            const userIsHost = meeting.hostId === user._id;
            if (userIsHost) {
                console.log('👑 User is the host of this meeting');
            }
        }
    }, [meeting, user]);

    const requestMediaPermission = async () => {
        try {
            setPermissionDenied(false);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support camera/microphone access');
            }

            console.log('Requesting camera and microphone permissions...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            setLocalStream(stream);
            console.log('✅ Permissions granted!');

        } catch (err) {
            console.error('❌ Permission denied:', err);
            setPermissionDenied(true);

            if (err.name === 'NotAllowedError') {
                alert('Please allow camera and microphone access to join the meeting. ' +
                    'Click the camera/microphone icon in your address bar and set to "Allow".');
            } else {
                alert('Could not access camera/microphone: ' + err.message);
            }
        }
    };

    const copyMeetingId = () => {
        navigator.clipboard.writeText(meetingId);
        alert('Meeting ID copied to clipboard!');
    };

    const shareMeeting = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: meeting?.title || 'Video Meeting',
                    text: 'Join my video meeting',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            copyMeetingId();
        }
    };

    // UPDATED: Optimized mobile video sizes
    const getVideoSizes = () => {
        const totalParticipants = 1 + remoteStreams.size;

        switch (deviceType) {
            case 'mobile':
                return {
                    selfVideo: { width: 110, height: 120 },
                    remoteVideo: {
                        width: '100%',
                        height: totalParticipants <= 2 ? '50vh' : '40vh'
                    },
                    gridCols: 'grid-cols-1',
                    containerWidth: '100%',
                    containerHeight: '100%',
                    minHeight: '180px'
                };
            case 'tablet':
                return {
                    selfVideo: { width: 200, height: 150 },
                    remoteVideo: {
                        width: '100%',
                        height: totalParticipants <= 4 ? '50vh' : '45vh'
                    },
                    gridCols: totalParticipants <= 2 ? 'grid-cols-2' : 'grid-cols-2',
                    containerWidth: '95vw',
                    containerHeight: '75vh'
                };
            default: // desktop
                return {
                    selfVideo: { width: 200, height: 150 },
                    remoteVideo: {
                        width: '100%',
                        height: '100%'
                    },
                    gridCols: totalParticipants <= 4 ? `grid-cols-${Math.min(2, totalParticipants)}` : 'grid-cols-3',
                    containerWidth: '825px',
                    containerHeight: '525px'
                };
        }
    };

    const videoSizes = getVideoSizes();
    const totalRemoteParticipants = remoteStreams.size;
    const hasRemoteParticipants = totalRemoteParticipants > 0;

    const getResponsiveGridCols = () => {
        if (deviceType === 'mobile') return 'grid-cols-1';
        
        const totalParticipants = totalRemoteParticipants;
        if (deviceType === 'tablet') {
            return totalParticipants <= 2 ? 'grid-cols-2' : 'grid-cols-2';
        }
        
        // Desktop
        if (totalParticipants === 1) return 'grid-cols-1';
        if (totalParticipants === 2) return 'grid-cols-2';
        if (totalParticipants <= 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    // Show join screen if no permissions yet
    if (!localStream && !permissionDenied) {
        return (
            <div className="min-h-screen bg-[#232333] flex items-center justify-center p-4">
                <div className="text-white text-center max-w-md">
                    <div className="w-20 h-20 bg-[#2d8cff] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FontAwesomeIcon icon={faVideo} className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Join Meeting</h1>
                    <p className="text-[#747487] text-lg mb-2">{meeting?.title || 'Quick Meeting'}</p>
                    <p className="text-[#747487] text-sm mb-8">ID: {meetingId}</p>

                    <button
                        onClick={requestMediaPermission}
                        className="w-full bg-[#2d8cff] hover:bg-[#1a7ae8] text-white px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] mb-4"
                    >
                        Join with Audio & Video
                    </button>

                    <div className="flex space-x-3 mb-6">
                        <button
                            onClick={copyMeetingId}
                            className="flex-1 bg-[#747487] hover:bg-[#5a5a6c] text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <FontAwesomeIcon icon={faCopy} />
                            <span>Copy ID</span>
                        </button>
                        <button
                            onClick={shareMeeting}
                            className="flex-1 bg-[#f26d21] hover:bg-[#da5d17] text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                            <FontAwesomeIcon icon={faShare} />
                            <span>Share</span>
                        </button>
                    </div>

                    <p className="text-[#747487] text-sm">
                        You'll be asked to allow camera and microphone access
                    </p>
                </div>
            </div>
        );
    }

    // Show permission denied screen
    if (permissionDenied) {
        return (
            <div className="min-h-screen bg-[#232333] flex items-center justify-center p-4">
                <div className="text-white text-center max-w-md">
                    <div className="w-16 h-16 bg-[#f26d21] rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faVideoSlash} className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-white">Permission Required</h1>
                    <p className="mb-6 text-[#747487]">Camera and microphone access is needed for this meeting.</p>

                    <div className="space-y-3 mb-8 text-left bg-[#2d2d44] p-4 rounded-xl">
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 bg-[#2d8cff] rounded-full flex items-center justify-center text-white text-xs">1</div>
                            <span className="text-[#747487]">Look for the camera icon in your address bar</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 bg-[#2d8cff] rounded-full flex items-center justify-center text-white text-xs">2</div>
                            <span className="text-[#747487]">Click it and select "Allow"</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 bg-[#2d8cff] rounded-full flex items-center justify-center text-white text-xs">3</div>
                            <span className="text-[#747487]">Then refresh this page</span>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={requestMediaPermission}
                            className="flex-1 bg-[#2d8cff] hover:bg-[#1a7ae8] text-white px-4 py-3 rounded-lg transition-colors duration-200"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-[#747487] hover:bg-[#5a5a6c] text-white px-4 py-3 rounded-lg transition-colors duration-200"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#232333] flex flex-col">
            {/* UPDATED: Better mobile header */}
            <header className="bg-[#2d2d44] text-white p-3 sm:p-4 shadow-lg">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2d8cff] rounded-xl flex items-center justify-center shadow-md">
                            <FontAwesomeIcon icon={faVideo} className="text-white text-sm sm:text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-lg font-bold text-white truncate">
                                {meeting?.title || 'Meeting'}
                            </h1>
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#747487]">
                                <span className="truncate">ID: {meetingId}</span>
                                <button
                                    onClick={copyMeetingId}
                                    className="hover:text-[#2d8cff] transition-colors duration-200 flex-shrink-0"
                                    title="Copy meeting ID"
                                >
                                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-normal">
                        <div className="text-right sm:text-right">
                            <div className="flex items-center space-x-2 text-xs sm:text-sm">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#2d8cff] rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-white text-sm sm:text-base truncate max-w-[80px] sm:max-w-none">{user?.name}</span>
                                {isHost && <span className="bg-[#f26d21] text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs flex-shrink-0">Host</span>}
                            </div>
                            <div className="text-xs text-[#747487] mt-1">
                                {participants.length + 1} participant{participants.length + 1 !== 1 ? 's' : ''}
                                {activeScreenSharer && ' • Sharing'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Screen Share Indicator */}
            {activeScreenSharer && (
                <div className="bg-[#2d8cff] text-white p-2 sm:p-3 mx-2 sm:mx-4 mt-2 rounded-lg shadow-md">
                    <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                        <FontAwesomeIcon icon={faDesktop} />
                        <span className="text-center">
                            <strong>{activeScreenSharer.user.name}</strong> is sharing screen
                        </span>
                        {activeScreenSharer.user.isHost && (
                            <span className="bg-[#f26d21] text-white px-1 sm:px-2 py-0.5 rounded text-xs ml-1 sm:ml-2">Host</span>
                        )}
                    </div>
                </div>
            )}

            {/* UPDATED: Better mobile layout */}
            <div className={`flex-1 ${deviceType === 'mobile' ? 'flex flex-col' : 'flex'}`}>
                {/* Video Container */}
                <div className={`${deviceType === 'mobile' ? 'flex-1' : 'flex-1'} relative p-2 sm:p-4`}>
                    <div className="w-full h-full flex justify-center items-center">
                        <div 
                            className="relative bg-[#1a1a2a] rounded-xl overflow-hidden shadow-2xl"
                            style={{
                                width: videoSizes.containerWidth,
                                height: deviceType === 'mobile' ? '70vh' : videoSizes.containerHeight,
                                maxWidth: '98vw',
                                maxHeight: deviceType === 'mobile' ? '70vh' : '80vh'
                            }}
                        >
                            {/* Remote Videos Grid */}
                            {hasRemoteParticipants ? (
                                <div className={`grid ${getResponsiveGridCols()} gap-2 sm:gap-3 lg:gap-4 h-full w-full`}>
                                    {Array.from(remoteStreams).map(([socketId, stream]) => {
                                        const participant = participants.find(p => p.socketId === socketId);
                                        const isSharingScreen = activeScreenSharer?.socketId === socketId;

                                        return (
                                            <div
                                                key={socketId}
                                                className="bg-[#2d2d44] rounded-xl overflow-hidden relative shadow-lg"
                                                style={{
                                                    height: videoSizes.remoteVideo.height,
                                                    minHeight: deviceType === 'mobile' ? '180px' : '200px'
                                                }}
                                            >
                                                <video
                                                    ref={videoRef => {
                                                        if (videoRef && stream) {
                                                            videoRef.srcObject = stream;
                                                        }
                                                        if (videoRef) {
                                                            remoteVideoRefs.current.set(socketId, videoRef);
                                                        }
                                                    }}
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black bg-opacity-60 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm backdrop-blur-sm">
                                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                                        <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                                                            {participant?.name || 'Remote User'}
                                                        </span>
                                                        {participant?.isHost && (
                                                            <span className="bg-[#f26d21] text-white px-1 sm:px-2 py-0.5 rounded text-xs flex-shrink-0">Host</span>
                                                        )}
                                                        {isSharingScreen && (
                                                            <span className="bg-[#2d8cff] text-white px-1 sm:px-2 py-0.5 rounded text-xs flex-shrink-0">Sharing</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black bg-opacity-60 rounded-full p-1 sm:p-2">
                                                    <FontAwesomeIcon icon={faMicrophone} className="text-green-400 text-xs" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // No Participants State
                                <div className="w-full h-full flex justify-center items-center content-center">
                                    <div className="text-center text-[#747487] max-w-md mx-4">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#2d2d44] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <FontAwesomeIcon icon={faUser} className="text-xl sm:text-2xl lg:text-3xl" />
                                        </div>
                                        <h3 className="text-base sm:text-lg lg:text-xl font-medium text-white mb-2">Waiting for participants</h3>
                                        <p className="text-xs sm:text-sm mb-3 sm:mb-4 lg:mb-6">Share this meeting ID to invite others</p>
                                        <div className="flex justify-center space-x-2 sm:space-x-3">
                                            <button
                                                onClick={copyMeetingId}
                                                className="bg-[#2d8cff] hover:bg-[#1a7ae8] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                                            >
                                                <FontAwesomeIcon icon={faCopy} />
                                                <span>Copy ID</span>
                                            </button>
                                            <button
                                                onClick={shareMeeting}
                                                className="bg-[#f26d21] hover:bg-[#da5d17] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                                            >
                                                <FontAwesomeIcon icon={faShare} />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Self Video */}
                            {localStream && (
                                <div
                                    className={`absolute ${
                                        deviceType === 'mobile' 
                                            ? 'bottom-3 right-3' 
                                            : 'bottom-4 right-4'
                                    } bg-[#2d2d44] rounded-lg overflow-hidden shadow-lg border-2 border-white/20`}
                                    style={{
                                        width: `${videoSizes.selfVideo.width}px`,
                                        height: `${videoSizes.selfVideo.height}px`,
                                        maxWidth: deviceType === 'mobile' ? '25vw' : 'none'
                                    }}
                                >
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black bg-opacity-60 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded text-xs backdrop-blur-sm">
                                        <div className="flex items-center space-x-1">
                                            <span className="font-medium text-xs">You</span>
                                            {isHost && (
                                                <span className="bg-[#f26d21] text-white px-1 py-0.5 rounded text-xs">Host</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-60 rounded-full p-1">
                                        <FontAwesomeIcon 
                                            icon={isAudioEnabled ? faMicrophone : faMicrophoneSlash} 
                                            className={isAudioEnabled ? "text-green-400 text-xs" : "text-red-400 text-xs"} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                <ChatPanel />
            </div>

            {/* UPDATED: Better mobile controls */}
            <div className="bg-[#2d2d44] p-3 sm:p-4 border-t border-[#747487]/20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-center space-x-2 sm:space-x-3 lg:space-x-4 flex-wrap">
                        {/* Audio Control */}
                        <button
                            onClick={toggleAudio}
                            className={`p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                isAudioEnabled
                                    ? 'bg-[#747487] hover:bg-[#5a5a6c] text-white'
                                    : 'bg-[#f26d21] hover:bg-[#da5d17] text-white'
                            }`}
                            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            <FontAwesomeIcon 
                                icon={isAudioEnabled ? faMicrophone : faMicrophoneSlash} 
                                className="text-sm sm:text-base" 
                            />
                        </button>

                        {/* Video Control */}
                        <button
                            onClick={toggleVideo}
                            className={`p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                isVideoEnabled
                                    ? 'bg-[#747487] hover:bg-[#5a5a6c] text-white'
                                    : 'bg-[#f26d21] hover:bg-[#da5d17] text-white'
                            }`}
                            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                        >
                            <FontAwesomeIcon 
                                icon={isVideoEnabled ? faVideo : faVideoSlash} 
                                className="text-sm sm:text-base" 
                            />
                        </button>

                        {/* Screen Share */}
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className={`p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                isScreenSharing
                                    ? 'bg-[#f26d21] hover:bg-[#da5d17] text-white'
                                    : 'bg-[#747487] hover:bg-[#5a5a6c] text-white'
                            }`}
                            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                        >
                            <FontAwesomeIcon 
                                icon={isScreenSharing ? faStop : faDesktop} 
                                className="text-sm sm:text-base" 
                            />
                        </button>

                        {/* Chat Button with Notification Badge */}
                        <button
                            onClick={toggleChat}
                            className={`p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-110 relative ${
                                isChatOpen
                                    ? 'bg-[#2d8cff] hover:bg-[#1a7ae8] text-white'
                                    : 'bg-[#747487] hover:bg-[#5a5a6c] text-white'
                            }`}
                            title={isChatOpen ? 'Close chat' : 'Open chat'}
                        >
                            <FontAwesomeIcon 
                                icon={faCommentDots} 
                                className="text-sm sm:text-base" 
                            />
                            
                            {/* Notification Badge - Only show when there are unread messages and chat is closed */}
                            {unreadMessages > 0 && !isChatOpen && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg border-2 border-[#2d2d44]">
                                    {unreadMessages > 9 ? '9+' : unreadMessages}
                                </span>
                            )}
                        </button>

                        {/* Leave/End Meeting */}
                        {isHost ? (
                            <button
                                onClick={endMeeting}
                                className="p-3 sm:p-4 rounded-full bg-[#f26d21] hover:bg-[#da5d17] text-white transition-all duration-200 transform hover:scale-110"
                                title="End meeting for everyone"
                            >
                                <FontAwesomeIcon 
                                    icon={faPowerOff} 
                                    className="text-sm sm:text-base" 
                                />
                            </button>
                        ) : (
                            <button
                                onClick={leaveMeeting}
                                className="p-3 sm:p-4 rounded-full bg-[#f26d21] hover:bg-[#da5d17] text-white transition-all duration-200 transform hover:scale-110"
                                title="Leave meeting"
                            >
                                <FontAwesomeIcon 
                                    icon={faPhoneSlash} 
                                    className="text-sm sm:text-base" 
                                />
                            </button>
                        )}
                    </div>

                    {/* Status Bar */}
                    <div className="text-center mt-3 sm:mt-4">
                        <p className="text-xs text-[#747487] px-2">
                            {isAudioEnabled ? 'Mic on' : 'Mic muted'} •
                            {isVideoEnabled ? ' Cam on' : ' Cam off'} •
                            {remoteStreams.size === 0
                                ? ' No participants'
                                : ` ${remoteStreams.size} participant${remoteStreams.size > 1 ? 's' : ''}`}
                            {isHost && ' • You are host'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingRoom;