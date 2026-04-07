const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a task (Admin/Manager only)
router.post('/', auth('manager'), async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and assignedTo are required' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: req.user.id
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks (Employee gets their own, Manager gets all)
router.get('/', auth(), async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'manager') {
      query.assignedTo = req.user.id;
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
      
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:id', auth(), async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only assigned employee or manager can update
    if (task.assignedTo.toString() !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.status = status || task.status;
    await task.save();
    
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
