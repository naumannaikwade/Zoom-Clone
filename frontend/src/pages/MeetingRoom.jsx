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
        let active = true;

        const loadMeeting = async () => {
            try {
                const response = await meetingsAPI.getMeeting(meetingId);
                if (active) setMeeting(response.data.data);
            } catch (requestError) {
                if (active) {
                    setError(requestError.response?.data?.message || 'Meeting is unavailable');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadMeeting();
        return () => {
            active = false;
        };
    }, [meetingId]);

    if (loading) {
        return (
            <div className="meeting-entry-page min-h-screen bg-[#232333] flex items-center justify-center">
                <div className="meeting-state text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d8cff] mx-auto mb-4"></div>
                    <p className="text-[#747487]">Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="meeting-entry-page min-h-screen bg-[#232333] flex items-center justify-center">
                <div className="meeting-entry-card meeting-state text-white text-center max-w-md mx-4">
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
        <SocketProvider>
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
        unreadMessages,
        connectionError
    } = useMeeting();

    const [permissionDenied, setPermissionDenied] = useState(false);
    const [previewStream, setPreviewStream] = useState(null);
    const [isPreparingMedia, setIsPreparingMedia] = useState(false);
    const [previewAudioEnabled, setPreviewAudioEnabled] = useState(true);
    const [previewVideoEnabled, setPreviewVideoEnabled] = useState(true);
    const [deviceType, setDeviceType] = useState('desktop');
    const navigate = useNavigate();
    const remoteVideoRefs = useRef(new Map());
    const previewVideoRef = useRef(null);
    const previewStreamRef = useRef(null);

    useEffect(() => {
        if (previewVideoRef.current && previewStream) {
            previewVideoRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    useEffect(() => () => {
        previewStreamRef.current?.getTracks().forEach((track) => track.stop());
    }, []);

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

    const requestMediaPermission = async () => {
        try {
            setPermissionDenied(false);
            setIsPreparingMedia(true);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support camera/microphone access');
            }

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

            previewStreamRef.current?.getTracks().forEach((track) => track.stop());
            previewStreamRef.current = stream;
            setPreviewStream(stream);
            setPreviewAudioEnabled(stream.getAudioTracks()[0]?.enabled ?? false);
            setPreviewVideoEnabled(stream.getVideoTracks()[0]?.enabled ?? false);
        } catch (err) {
            setPermissionDenied(true);

            if (err.name === 'NotAllowedError') {
                alert('Please allow camera and microphone access to join the meeting. ' +
                    'Click the camera/microphone icon in your address bar and set to "Allow".');
            } else {
                alert('Could not access camera/microphone: ' + err.message);
            }
        } finally {
            setIsPreparingMedia(false);
        }
    };

    const togglePreviewTrack = (kind) => {
        const track = kind === 'audio'
            ? previewStream?.getAudioTracks()[0]
            : previewStream?.getVideoTracks()[0];

        if (!track) return;
        track.enabled = !track.enabled;

        if (kind === 'audio') setPreviewAudioEnabled(track.enabled);
        if (kind === 'video') setPreviewVideoEnabled(track.enabled);
    };

    const enterMeeting = () => {
        if (!previewStream) return;
        previewStreamRef.current = null;
        setLocalStream(previewStream);
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
            } catch {
                // The user cancelled the native share dialog.
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
                    selfVideo: { width: 210, height: 142 },
                    remoteVideo: {
                        width: '100%',
                        height: '100%'
                    },
                    gridCols: totalParticipants <= 4 ? `grid-cols-${Math.min(2, totalParticipants)}` : 'grid-cols-3',
                    containerWidth: 'min(100%, 1120px)',
                    containerHeight: 'min(72vh, 680px)'
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
            <div className="prejoin-page">
                <header className="prejoin-header">
                    <img src="/xzoom-logo-dark.svg" alt="XZoom" />
                    <button type="button" onClick={() => navigate('/')}>Back to dashboard</button>
                </header>

                <main className="prejoin-layout">
                    <section className="prejoin-preview" aria-label="Camera preview">
                        {previewStream ? (
                            <>
                                <video ref={previewVideoRef} autoPlay playsInline muted />
                                {!previewVideoEnabled && (
                                    <div className="camera-off-state">
                                        <span>{(user?.name || 'Guest').charAt(0).toUpperCase()}</span>
                                        <p>Camera is off</p>
                                    </div>
                                )}
                                <div className="prejoin-preview-label">{user?.name || 'Guest'} · You</div>
                                <div className="prejoin-device-controls">
                                    <button
                                        type="button"
                                        className={!previewAudioEnabled ? 'is-off' : ''}
                                        onClick={() => togglePreviewTrack('audio')}
                                        aria-label={previewAudioEnabled ? 'Mute preview microphone' : 'Unmute preview microphone'}
                                    >
                                        <FontAwesomeIcon icon={previewAudioEnabled ? faMicrophone : faMicrophoneSlash} />
                                        <span>{previewAudioEnabled ? 'Mute' : 'Unmute'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={!previewVideoEnabled ? 'is-off' : ''}
                                        onClick={() => togglePreviewTrack('video')}
                                        aria-label={previewVideoEnabled ? 'Turn off preview camera' : 'Turn on preview camera'}
                                    >
                                        <FontAwesomeIcon icon={previewVideoEnabled ? faVideo : faVideoSlash} />
                                        <span>{previewVideoEnabled ? 'Stop video' : 'Start video'}</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="prejoin-placeholder">
                                <span><FontAwesomeIcon icon={faVideo} /></span>
                                <h2>Check your camera and microphone</h2>
                                <p>You can choose what stays on before entering.</p>
                            </div>
                        )}
                    </section>

                    <section className="prejoin-details" aria-labelledby="prejoin-title">
                        <p className="prejoin-kicker">Ready to join?</p>
                        <h1 id="prejoin-title">{meeting?.title || 'Quick Meeting'}</h1>
                        <button className="prejoin-meeting-id" type="button" onClick={copyMeetingId}>
                            <span>{meetingId}</span>
                            <FontAwesomeIcon icon={faCopy} />
                            <span className="sr-only">Copy meeting ID</span>
                        </button>

                        {previewStream ? (
                            <button className="prejoin-primary" type="button" onClick={enterMeeting}>Join meeting</button>
                        ) : (
                            <button className="prejoin-primary" type="button" onClick={requestMediaPermission} disabled={isPreparingMedia}>
                                {isPreparingMedia ? 'Preparing devices…' : 'Set up audio and video'}
                            </button>
                        )}

                        <button className="prejoin-secondary" type="button" onClick={shareMeeting}>
                            <FontAwesomeIcon icon={faShare} />
                            Share meeting
                        </button>

                        <p className="prejoin-note">
                            {previewStream ? 'Your settings can also be changed inside the meeting.' : 'Your browser will ask for camera and microphone permission.'}
                        </p>
                    </section>
                </main>
            </div>
        );
    }

    // Show permission denied screen
    if (permissionDenied) {
        return (
            <div className="meeting-entry-page min-h-screen bg-[#232333] flex items-center justify-center p-4">
                <div className="meeting-entry-card text-white text-center max-w-md">
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
        <div className="meeting-room min-h-screen bg-[#232333] flex flex-col">
            <header className="meeting-room-header bg-[#2d2d44] text-white p-3 sm:p-4 shadow-lg">
                <div className="meeting-room-header-inner">
                    <div className="meeting-title-group">
                        <img className="meeting-brand-logo" src="/xzoom-mark.svg" alt="XZoom" />
                        <div>
                            <h1>{meeting?.title || 'Meeting'}</h1>
                            <p>{isHost ? 'You are the host' : 'XZoom meeting'}</p>
                        </div>
                    </div>

                    <div className="meeting-header-actions">
                        <button className="meeting-id-chip" type="button" onClick={copyMeetingId} title="Copy meeting ID">
                            <span>{meetingId}</span>
                            <FontAwesomeIcon icon={faCopy} />
                        </button>
                        <div className="participant-count" title="Participants in meeting">
                            <FontAwesomeIcon icon={faUser} />
                            <span>{participants.length + 1}</span>
                        </div>
                        <div className="meeting-user" title={user?.name || 'Guest'}>
                            {(user?.name || 'Guest').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            {connectionError && (
                <div className="meeting-alert" role="alert">
                    {connectionError}
                </div>
            )}

            {/* Screen Share Indicator */}
            {activeScreenSharer && (
                <div className="sharing-banner" role="status">
                    <div>
                        <FontAwesomeIcon icon={faDesktop} />
                        <span>
                            <strong>{activeScreenSharer.user.name}</strong> is sharing screen
                        </span>
                    </div>
                </div>
            )}

            <div className={`meeting-content flex-1 ${deviceType === 'mobile' ? 'flex flex-col' : 'flex'} ${isChatOpen ? 'has-chat' : ''}`}>
                {/* Video Container */}
                <div className={`meeting-stage ${deviceType === 'mobile' ? 'flex-1' : 'flex-1'} relative p-2 sm:p-4`}>
                    <div className="w-full h-full flex justify-center items-center">
                        <div 
                            className="meeting-video-frame relative bg-[#1a1a2a] rounded-xl overflow-hidden shadow-2xl"
                            style={{
                                width: videoSizes.containerWidth,
                                height: deviceType === 'mobile' ? '70vh' : videoSizes.containerHeight,
                                maxWidth: '98vw',
                                maxHeight: deviceType === 'mobile' ? '70vh' : '80vh'
                            }}
                        >
                            {/* Remote Videos Grid */}
                            {hasRemoteParticipants ? (
                                <div className={`participant-grid grid ${getResponsiveGridCols()} h-full w-full`}>
                                    {Array.from(remoteStreams).map(([socketId, stream]) => {
                                        const participant = participants.find(p => p.socketId === socketId);
                                        const isSharingScreen = activeScreenSharer?.socketId === socketId;

                                        return (
                                            <article
                                                key={socketId}
                                                className="participant-tile"
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
                                                <div className="participant-meta">
                                                    <span>{participant?.name || 'Remote user'}</span>
                                                    {participant?.isHost && <span className="participant-badge">Host</span>}
                                                    {isSharingScreen && <span className="participant-badge is-sharing">Sharing</span>}
                                                </div>
                                                <div className="participant-mic" title="Microphone on">
                                                    <FontAwesomeIcon icon={faMicrophone} />
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="solo-stage">
                                    <video
                                        ref={(video) => {
                                            localVideoRef.current = video;
                                            if (video && localStream) video.srcObject = localStream;
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    {!isVideoEnabled && (
                                        <div className="camera-off-state">
                                            <span>{(user?.name || 'Guest').charAt(0).toUpperCase()}</span>
                                            <p>Camera is off</p>
                                        </div>
                                    )}
                                    <div className="participant-meta solo-name">
                                        <span>{user?.name || 'Guest'} · You</span>
                                        {isHost && <span className="participant-badge">Host</span>}
                                    </div>
                                    <div className="solo-invite">
                                        <div>
                                            <strong>You’re the only one here</strong>
                                            <span>Invite someone with the meeting ID.</span>
                                        </div>
                                        <div>
                                            <button type="button" onClick={copyMeetingId}><FontAwesomeIcon icon={faCopy} /> Copy ID</button>
                                            <button type="button" onClick={shareMeeting}><FontAwesomeIcon icon={faShare} /> Share</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Self Video */}
                            {localStream && hasRemoteParticipants && (
                                <div
                                    className={`absolute ${
                                        deviceType === 'mobile' 
                                            ? 'bottom-3 right-3' 
                                            : 'bottom-4 right-4'
                                    } self-video-tile`}
                                    style={{
                                        width: `${videoSizes.selfVideo.width}px`,
                                        height: `${videoSizes.selfVideo.height}px`,
                                        maxWidth: deviceType === 'mobile' ? '25vw' : 'none'
                                    }}
                                >
                                    <video
                                        ref={(video) => {
                                            localVideoRef.current = video;
                                            if (video && localStream) video.srcObject = localStream;
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {!isVideoEnabled && (
                                        <div className="camera-off-state compact">
                                            <span>{(user?.name || 'Guest').charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div className="self-video-label">
                                        <span>You</span>
                                        {isHost && <span>Host</span>}
                                    </div>
                                    <div className={`self-audio-state ${isAudioEnabled ? '' : 'is-muted'}`}>
                                        <FontAwesomeIcon 
                                            icon={isAudioEnabled ? faMicrophone : faMicrophoneSlash} 
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
            <div className="meeting-control-bar bg-[#2d2d44] p-3 sm:p-4 border-t border-[#747487]/20">
                <div className="meeting-controls-wrap max-w-4xl mx-auto">
                    <div className="meeting-controls flex justify-center space-x-2 sm:space-x-3 lg:space-x-4 flex-wrap">
                        {/* Audio Control */}
                        <button
                            onClick={toggleAudio}
                            className={`meeting-control ${
                                isAudioEnabled
                                    ? ''
                                    : 'is-danger'
                            }`}
                            aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            <FontAwesomeIcon 
                                icon={isAudioEnabled ? faMicrophone : faMicrophoneSlash} 
                                className="text-sm sm:text-base" 
                            />
                            <span>{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                        </button>

                        {/* Video Control */}
                        <button
                            onClick={toggleVideo}
                            className={`meeting-control ${
                                isVideoEnabled
                                    ? ''
                                    : 'is-danger'
                            }`}
                            aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                        >
                            <FontAwesomeIcon 
                                icon={isVideoEnabled ? faVideo : faVideoSlash} 
                                className="text-sm sm:text-base" 
                            />
                            <span>{isVideoEnabled ? 'Stop video' : 'Start video'}</span>
                        </button>

                        {/* Screen Share */}
                        <button
                            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                            className={`meeting-control ${
                                isScreenSharing
                                    ? 'is-active'
                                    : ''
                            }`}
                            aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                        >
                            <FontAwesomeIcon 
                                icon={isScreenSharing ? faStop : faDesktop} 
                                className="text-sm sm:text-base" 
                            />
                            <span>{isScreenSharing ? 'Stop share' : 'Share'}</span>
                        </button>

                        {/* Chat Button with Notification Badge */}
                        <button
                            onClick={toggleChat}
                            className={`meeting-control relative ${
                                isChatOpen
                                    ? 'is-active'
                                    : ''
                            }`}
                            aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
                            title={isChatOpen ? 'Close chat' : 'Open chat'}
                        >
                            <FontAwesomeIcon 
                                icon={faCommentDots} 
                                className="text-sm sm:text-base" 
                            />
                            <span>Chat</span>
                            
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
                                className="meeting-control is-danger meeting-exit-control"
                                aria-label="End meeting for everyone"
                                title="End meeting for everyone"
                            >
                                <FontAwesomeIcon 
                                    icon={faPowerOff} 
                                    className="text-sm sm:text-base" 
                                />
                                <span>End</span>
                            </button>
                        ) : (
                            <button
                                onClick={leaveMeeting}
                                className="meeting-control is-danger meeting-exit-control"
                                aria-label="Leave meeting"
                                title="Leave meeting"
                            >
                                <FontAwesomeIcon 
                                    icon={faPhoneSlash} 
                                    className="text-sm sm:text-base" 
                                />
                                <span>Leave</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MeetingRoom;
