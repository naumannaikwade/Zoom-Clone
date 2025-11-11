import React, { useState, useRef, useEffect } from 'react';
import { useMeeting } from '../contexts/MeetingContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatPanel = () => {
  const { chatMessages, sendChatMessage, chatContainerRef, isChatOpen, toggleChat } = useMeeting();
  const [message, setMessage] = useState('');
  const messageInputRef = useRef();

  useEffect(() => {
    if (isChatOpen && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatContainerRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:right-4 sm:top-20 sm:bottom-24 sm:w-80 bg-[#2d2d44] border border-[#747487]/30 rounded-2xl shadow-2xl flex flex-col z-50 m-4 sm:m-0">
      {/* Chat Header */}
      <div className="bg-[#232333] p-4 rounded-t-2xl border-b border-[#747487]/30">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg">Meeting Chat</h3>
          <button 
            onClick={toggleChat}
            className="text-[#747487] hover:text-white transition-colors duration-200 p-1"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <p className="text-[#747487] text-sm mt-1">
          {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-[#747487] mt-8">
            <div className="w-16 h-16 bg-[#2d2d44] rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faPaperPlane} className="text-2xl" />
            </div>
            <p className="text-white font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={msg._id || msg.timestamp} className="flex flex-col animate-fadeIn">
              <div className="flex items-baseline space-x-2 mb-1">
                <span 
                  className={`font-semibold text-sm ${
                    msg.sender.isHost ? 'text-[#f26d21]' : 'text-[#2d8cff]'
                  }`}
                >
                  {msg.sender.name}
                  {msg.sender.isHost && ' 👑'}
                </span>
                <span className="text-xs text-[#747487]">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div className="bg-[#232333] rounded-xl p-3">
                <p className="text-white text-sm break-words leading-relaxed">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#747487]/30 bg-[#232333] rounded-b-2xl">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#2d2d44] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8cff] border border-[#747487]/30 placeholder-[#747487]"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-[#2d8cff] hover:bg-[#1a7ae8] disabled:bg-[#747487] disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
            title="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
          </button>
        </form>
        <div className="text-right mt-2">
          <span className="text-xs text-[#747487]">
            {message.length}/1000
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;