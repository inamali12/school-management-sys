const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true
  },
  numericGrade: {
    type: Number,
    required: [true, 'Grade number is required'],
    min: 1,
    max: 12
  },
  sections: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  classTeacherName: {
    type: String,
    default: 'Unassigned'
  },
  monthlyTuitionFee: {
    type: Number,
    required: [true, 'Monthly tuition fee is required'],
    min: 0,
    default: 3000
  },
  roomNumber: {
    type: String,
    default: 'Room 101',
    trim: true
  },
  capacity: {
    type: Number,
    default: 40
  },
  subjects: [{
    type: String,
    trim: true
  }],
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Class', classSchema);

