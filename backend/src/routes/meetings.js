const express = require('express');
const Meeting = require('../models/Meeting');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate unique meeting ID
const generateMeetingId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const meetingId = generateMeetingId();
    
    const meeting = await Meeting.create({
      meetingId,
      hostId: req.user.id,
      title: req.body.title || 'Quick Meeting'
    });

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
// @access  Public (for guest joins)
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.id })
      .populate('hostId', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user's meeting history
// @route   GET /api/meetings/history/my-meetings
// @access  Private
router.get('/history/my-meetings', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ hostId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    End a meeting
// @route   POST /api/meetings/:id/end
// @access  Private (host only)
router.post('/:id/end', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.id });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.hostId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this meeting'
      });
    }

    meeting.isActive = false;
    meeting.endTime = new Date();
    await meeting.save();

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;