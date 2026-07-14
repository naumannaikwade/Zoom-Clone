const crypto = require("crypto");

const normalizeMeetingId = (value) => String(value || "").trim().toUpperCase();

const createMeetingId = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const isMeetingHost = (hostId, userId) => {
  if (!hostId || !userId) {
    return false;
  }

  const normalizedHostId = hostId._id || hostId;
  return normalizedHostId.toString() === userId.toString();
};

const sanitizeDisplayName = (value, fallback = "Guest") => {
  const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 50);
  return name || fallback;
};

const formatChatMessage = (message) => ({
  _id: message._id,
  meetingId: message.meetingId,
  sender: {
    id: message.senderId,
    name: message.senderName,
    isHost: Boolean(message.senderIsHost),
  },
  message: message.message,
  timestamp: message.timestamp,
});

module.exports = {
  createMeetingId,
  formatChatMessage,
  isMeetingHost,
  normalizeMeetingId,
  sanitizeDisplayName,
};
