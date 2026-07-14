const express = require('express');
const Meeting = require('../models/Meeting');
const { protect } = require('../middleware/auth');
const {
  createMeetingId,
  isMeetingHost,
  normalizeMeetingId,
} = require('../utils/meeting');

const router = express.Router();

const generateUniqueMeetingId = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const meetingId = createMeetingId();
    const exists = await Meeting.exists({ meetingId });
    if (!exists) {
      return meetingId;
    }
  }

  throw new Error('Unable to generate a unique meeting ID');
};

// @desc    Create a new meeting
// @route   POST /api/meetings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const meetingId = await generateUniqueMeetingId();
    const title = String(req.body.title || 'Quick Meeting').trim().slice(0, 120);
    
    const meeting = await Meeting.create({
      meetingId,
      hostId: req.user.id,
      title: title || 'Quick Meeting',
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Unable to create meeting:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to create meeting'
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
    console.error('Unable to load meeting history:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to load meeting history'
    });
  }
});

// @desc    Get an active meeting by ID
// @route   GET /api/meetings/:id
// @access  Public (for guest joins)
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingId: normalizeMeetingId(req.params.id)
    }).populate('hostId', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (!meeting.isActive) {
      return res.status(410).json({
        success: false,
        message: 'Meeting has ended'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Unable to load meeting:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to load meeting'
    });
  }
});

// @desc    End a meeting
// @route   POST /api/meetings/:id/end
// @access  Private (host only)
router.post('/:id/end', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingId: normalizeMeetingId(req.params.id)
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (!isMeetingHost(meeting.hostId, req.user.id)) {
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
    console.error('Unable to end meeting:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to end meeting'
    });
  }
});

module.exports = router;
