const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true // Single field index for email lookups
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  },
  date: {
    type: Date,
    default: Date.now,
    index: true // Index for date sorting
  }
});

// Compound index for optimized sorting of a student's records by date
attendanceSchema.index({ studentEmail: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);