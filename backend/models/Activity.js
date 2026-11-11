const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['admission', 'attendance', 'payment', 'fee', 'teacher_registered', 'class_created', 'system', 'user'],
    required: [true, 'Activity type is required']
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  performedBy: {
    type: String,
    default: 'System'
  },
  user: {
    type: String,
    default: 'System'
  },
  role: {
    type: String,
    default: 'admin'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
