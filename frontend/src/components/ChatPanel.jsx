import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useMeeting } from '../contexts/MeetingContext';

const ChatPanel = () => {
  const { chatMessages, sendChatMessage, chatContainerRef, isChatOpen, toggleChat } = useMeeting();
  const [message, setMessage] = useState('');
  const messageInputRef = useRef();

  useEffect(() => {
    if (isChatOpen) messageInputRef.current?.focus();
  }, [isChatOpen]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatContainerRef]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    sendChatMessage(message);
    setMessage('');
  };

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!isChatOpen) return null;

  return (
    <aside className="chat-panel" aria-label="Meeting chat">
      <header className="chat-header">
        <div>
          <p className="chat-kicker">Conversation</p>
          <h2>Meeting chat</h2>
        </div>
        <button type="button" onClick={toggleChat} aria-label="Close chat">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </header>

      <div className="chat-message-count">
        {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
      </div>

      <div ref={chatContainerRef} className="chat-messages" role="log" aria-live="polite">
        {chatMessages.length === 0 ? (
          <div className="chat-empty">
            <span aria-hidden="true"><FontAwesomeIcon icon={faPaperPlane} /></span>
            <h3>No messages yet</h3>
            <p>Send the first message to the room.</p>
          </div>
        ) : (
          chatMessages.map((chatMessage) => (
            <article className="chat-message" key={chatMessage._id || chatMessage.timestamp}>
              <div className="chat-message-meta">
                <strong className={chatMessage.sender?.isHost ? 'is-host' : ''}>
                  {chatMessage.sender?.name || chatMessage.senderName || 'Participant'}
                  {chatMessage.sender?.isHost && ' · Host'}
                </strong>
                <time>{formatTime(chatMessage.timestamp)}</time>
              </div>
              <p>{chatMessage.message}</p>
            </article>
          ))
        )}
      </div>

      <form className="chat-compose" onSubmit={handleSubmit}>
        <div>
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a message"
            aria-label="Chat message"
            maxLength={1000}
          />
          <span>{message.length}/1000</span>
        </div>
        <button type="submit" disabled={!message.trim()} aria-label="Send message" title="Send message">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </aside>
  );
};

export default ChatPanel;
