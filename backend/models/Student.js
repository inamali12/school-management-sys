const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true
  },
  dob: {
    type: String,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Student contact number is required'],
    trim: true
  },
  parentContact: {
    type: String,
    required: [true, 'Parent contact number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  admissionDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  photoUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Suspended'],
    default: 'Active'
  },
  bFormOrCnic: {
    type: String,
    trim: true
  },
  monthlyTuitionFee: {
    type: Number,
    required: [true, 'Monthly tuition fee is required'],
    min: 0,
    default: 3000
  },
  emergencyContact: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for fast searching & filtering
studentSchema.index({ className: 1, section: 1 });
studentSchema.index({ fullName: 'text', fatherName: 'text', studentId: 'text' });

module.exports = mongoose.model('Student', studentSchema);

