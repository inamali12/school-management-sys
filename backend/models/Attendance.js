const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true,
    uppercase: true
  },
  studentName: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  className: {
    type: String,
    required: [true, 'Class Name is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Attendance date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    default: 'Present'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  markedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// CRITICAL REQUIREMENT: Prevent duplicate attendance records for the same student on the same date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ className: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

