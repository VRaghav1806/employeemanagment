require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const taskRoutes = require('./routes/tasks');
const attendanceRoutes = require('./routes/attendance');

const app = express();

app.use(cors());
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);

// Static file serving from frontend/dist
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// SPA catch-all route (should be after API routes)
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('⚠️ WARNING: MONGO_URI is not set. Falling back to local MongoDB.');
} else {
  console.log('ℹ️ Found MONGO_URI in environment. Connecting to Atlas...');
}

const connectionString = MONGO_URI || 'mongodb://localhost:27017/manager_dashboard';

mongoose
  .connect(connectionString)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:');
    if (err.name === 'MongoNetworkError') {
      console.error('  -> Network Error: Please check your IP whitelist in MongoDB Atlas.');
    }
    console.error('  -> Details:', err.message);
    if (err.cause) {
      console.error('  -> Cause:', err.cause.message);
    }
  });

module.exports = app;

