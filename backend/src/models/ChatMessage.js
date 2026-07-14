const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  senderName: {
    type: String,
    required: true
  },
  senderIsHost: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
chatMessageSchema.index({ meetingId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
