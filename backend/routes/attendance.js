const express = require('express');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

const router = express.Router();

// Clock In
router.post('/clock-in', auth(), async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if user has an unfinished session from ANY day
    const active = await Attendance.findOne({ userId: req.user.id, status: 'active' });
    
    if (active) {
      if (active.date === today) {
        return res.status(400).json({ message: 'User is already clocked in for today' });
      } else {
        // Auto-close stale session from a previous day
        active.status = 'completed';
        active.clockOut = active.clockIn; // Best guess if missing
        await active.save();
      }
    }

    const record = await Attendance.create({
      userId: req.user.id,
      clockIn: now,
      date: today,
      status: 'active'
    });

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clock Out
router.post('/clock-out', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ userId: req.user.id, status: 'active', date: today });
    
    if (!record) {
      return res.status(400).json({ message: 'No active clock-in session found for today' });
    }

    record.clockOut = new Date();
    record.status = 'completed';
    await record.save();

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current status (for frontend persistence)
router.get('/status', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const active = await Attendance.findOne({ userId: req.user.id, status: 'active', date: today });
    res.json(active);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all logs (Admin) or user's logs (Employee)
router.get('/', auth(), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let query = {};
    
    if (req.user.role !== 'manager') {
      query.userId = req.user.id;
    } else {
      // Admin only sees TODAY'S logs by default to keep the UI "reset"
      query.date = today;
    }

    const logs = await Attendance.find(query)
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 });
    
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
