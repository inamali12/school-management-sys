const bcrypt = require('bcryptjs');
const Storage = require('../utils/storage');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await Storage.users.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new user account
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, username, password, role, phone, teacherRef, studentIds } = req.body;

    if (!name || !email || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Name, Email, Username, Password, and Role'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    // Check unique email / username
    const existingEmail = await Storage.users.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `A user with email "${trimmedEmail}" already exists`
      });
    }

    const existingUsername = await Storage.users.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: `A user with username "${trimmedUsername}" already exists`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let parsedStudentIds = [];
    if (Array.isArray(studentIds)) {
      parsedStudentIds = studentIds;
    } else if (typeof studentIds === 'string' && studentIds.trim()) {
      parsedStudentIds = studentIds.split(',').map(s => s.trim().toUpperCase());
    }

    const newUser = await Storage.users.create({
      name: name.trim(),
      email: trimmedEmail,
      username: trimmedUsername,
      password: hashedPassword,
      role,
      phone: phone ? phone.trim() : '',
      teacherRef: teacherRef || null,
      studentIds: parsedStudentIds,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: `User account "${newUser.username}" (${newUser.role}) created successfully!`,
      data: newUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.users.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `User "${id}" not found`
      });
    }

    const updatePayload = { ...req.body };

    // If password provided, hash it
    if (updatePayload.password && updatePayload.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(updatePayload.password.trim(), salt);
    } else {
      delete updatePayload.password;
    }

    if (updatePayload.studentIds && typeof updatePayload.studentIds === 'string') {
      updatePayload.studentIds = updatePayload.studentIds.split(',').map(s => s.trim().toUpperCase());
    }

    const updated = await Storage.users.updateById(existing._id, updatePayload);

    res.status(200).json({
      success: true,
      message: `User "${updated.username}" updated successfully!`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.users.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `User "${id}" not found`
      });
    }

    // Prevent deleting the main admin account
    if (existing.username === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'The primary system admin account cannot be deleted.'
      });
    }

    await Storage.users.deleteById(existing._id);

    res.status(200).json({
      success: true,
      message: `User "${existing.username}" deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};

