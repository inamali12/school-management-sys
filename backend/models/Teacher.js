const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Primary subject is required'],
    trim: true
  },
  assignedSubjects: [{
    type: String,
    trim: true
  }],
  assignedClass: {
    type: String,
    trim: true,
    default: 'None'
  },
  assignedClasses: [{
    type: String,
    trim: true
  }],
  joiningDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: 0,
    default: 35000
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned'],
    default: 'Active'
  },
  cnic: {
    type: String,
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

teacherSchema.index({ fullName: 'text', teacherId: 'text', subject: 'text' });

module.exports = mongoose.model('Teacher', teacherSchema);

