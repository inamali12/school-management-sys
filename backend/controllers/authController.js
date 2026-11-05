const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Storage = require('../utils/storage');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'schoolconnect_default_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Login user & get JWT token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password'
      });
    }

    const trimmedInput = username.trim().toLowerCase();

    // Find by email or username
    let user = await Storage.users.findOne({ email: trimmedInput }, true);
    if (!user) {
      user = await Storage.users.findOne({ username: trimmedInput }, true);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact school administration.'
      });
    }

    const token = generateToken(user._id, user.role);

    // Strip password from returned object
    const { password: pwd, ...safeUser } = user;

    res.status(200).json({
      success: true,
      token,
      user: safeUser,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let extraData = {};

    // If teacher, fetch assigned teacher details
    if (user.role === 'teacher' && user.teacherRef) {
      const teacherProfile = await Storage.teachers.findById(user.teacherRef);
      extraData.teacherProfile = teacherProfile;
    }

    // If parent, fetch their linked children
    if (user.role === 'parent' && user.studentIds && user.studentIds.length > 0) {
      const children = [];
      for (const sid of user.studentIds) {
        const student = await Storage.students.findByStudentId(sid) || await Storage.students.findById(sid);
        if (student) children.push(student);
      }
      extraData.children = children;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        ...extraData
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await Storage.users.findById(req.user._id);
    const fullUser = await Storage.users.findOne({ _id: req.user._id }, true);

    const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await Storage.users.updateById(req.user._id, { password: hashed });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

