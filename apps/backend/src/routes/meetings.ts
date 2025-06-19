import express from 'express';
import Meeting from '../models/Meeting';

const router = express.Router();

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const { meetingId, hostId } = req.body;
    
    // Check if meeting already exists
    const existingMeeting = await Meeting.findOne({ meetingId });
    if (existingMeeting) {
      return res.status(400).json({ message: 'Meeting already exists' });
    }
    
    const newMeeting = new Meeting({
      meetingId,
      hostId
    });
    
    const savedMeeting = await newMeeting.save();
    res.status(201).json(savedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// End a meeting
router.patch('/:meetingId/end', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    meeting.isActive = false;
    meeting.endTime = new Date();
    const updatedMeeting = await meeting.save();
    
    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add participant to meeting
router.patch('/:meetingId/participants', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    if (!meeting.participants.includes(userId)) {
      meeting.participants.push(userId);
      await meeting.save();
    }
    
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get meeting details
router.get('/:meetingId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;