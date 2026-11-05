const mongoose = require('mongoose');

const paymentSubSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    default: () => 'PAY-' + Date.now().toString(36).toUpperCase()
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  paymentDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'JazzCash', 'EasyPaisa', 'Bank Transfer', 'Cheque'],
    default: 'Cash'
  },
  receiptNo: {
    type: String,
    default: () => 'REC-' + Math.floor(100000 + Math.random() * 900000)
  },
  receivedBy: {
    type: String,
    default: 'Admin'
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: false, timestamps: true });

const feeSchema = new mongoose.Schema({
  feeId: {
    type: String,
    required: [true, 'Fee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true,
    uppercase: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
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
  month: {
    type: String,
    required: [true, 'Fee month is required'],
    trim: true
  },
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  tuitionFee: {
    type: Number,
    required: [true, 'Tuition fee is required'],
    min: 0
  },
  examFee: {
    type: Number,
    default: 0,
    min: 0
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFee: {
    type: Number,
    required: [true, 'Total fee is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    required: [true, 'Remaining balance is required'],
    min: 0
  },
  dueDate: {
    type: String,
    required: [true, 'Due date is required']
  },
  paymentDate: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending', 'Overdue'],
    default: 'Pending'
  },
  payments: [paymentSubSchema]
}, {
  timestamps: true
});

// CRITICAL REQUIREMENT: Prevent duplicate monthly fee records for the same student
feeSchema.index({ student: 1, month: 1 }, { unique: true });
feeSchema.index({ className: 1, month: 1 });
feeSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Fee', feeSchema);

