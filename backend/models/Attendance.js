const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { 
      type: String, 
      enum: ['active', 'completed'], 
      default: 'active' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
