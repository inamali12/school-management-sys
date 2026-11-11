const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    required: [true, 'Please provide username'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    default: 'admin'
  },
  phone: {
    type: String,
    trim: true
  },
  teacherRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  studentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  studentId: {
    type: String,
    trim: true,
    uppercase: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  // If already a valid bcrypt hash, do not re-hash to prevent double-hashing
  if (typeof this.password === 'string' && /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
