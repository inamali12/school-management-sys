const bcrypt = require('bcryptjs');
const Storage = require('../utils/storage');
const User = require('../models/User');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const { getMongoStatus } = require('../config/db');

// Helper to log audit activity
async function logAudit(action, details, user) {
  try {
    if (getMongoStatus() && Activity) {
      await Activity.create({
        user: user.name || 'Administrator',
        role: user.role || 'admin',
        action,
        module: 'Parent Management',
        details,
        ipAddress: '127.0.0.1'
      });
    }
  } catch (err) {
    console.warn('Activity log notice:', err.message);
  }
}

// @desc    Get all parents with summary stats, search and filters
// @route   GET /api/parents
// @access  Private (Admin only)
exports.getParents = async (req, res, next) => {
  try {
    const { search, filter } = req.query;

    // 1. Fetch all parent users
    let parents = [];
    if (getMongoStatus()) {
      parents = await User.find({ role: 'parent' }).select('-password').sort({ createdAt: -1 }).lean();
    } else {
      parents = await Storage.users.find({ role: 'parent' });
    }

    // 2. Fetch all students to resolve relationships
    const allStudents = await Storage.students.find({});

    // 3. Map linked children to each parent
    const parentsWithChildren = parents.map(parent => {
      const allowedStudentIds = (parent.studentIds || []).map(id => String(id).toUpperCase());
      const pIdStr = String(parent._id).toUpperCase();
      const pEmail = (parent.email || '').toLowerCase();

      const linked = allStudents.filter(s => {
        const sMongoId = String(s._id).toUpperCase();
        const sCustomId = String(s.studentId).toUpperCase();
        const sParentId = s.parentId ? String(s.parentId).toUpperCase() : '';
        const sParentEmail = s.parentEmail ? s.parentEmail.toLowerCase() : '';

        return allowedStudentIds.includes(sMongoId) ||
               allowedStudentIds.includes(sCustomId) ||
               (sParentId && sParentId === pIdStr) ||
               (sParentEmail && sParentEmail === pEmail);
      });

      return {
        ...parent,
        linkedChildrenCount: linked.length,
        isLinked: linked.length > 0,
        linkedChildren: linked.map(c => ({
          _id: c._id,
          studentId: c.studentId,
          fullName: c.fullName,
          className: c.className,
          section: c.section,
          rollNumber: c.rollNumber,
          gender: c.gender,
          photoUrl: c.photoUrl,
          status: c.status
        }))
      };
    });

    // 4. Compute Summary Statistics across all parents
    const totalParents = parentsWithChildren.length;
    const linkedParents = parentsWithChildren.filter(p => p.isLinked).length;
    const unlinkedParents = totalParents - linkedParents;
    const totalRelationships = parentsWithChildren.reduce((sum, p) => sum + p.linkedChildrenCount, 0);

    // 5. Apply filters & search
    let filtered = parentsWithChildren;

    if (filter === 'linked') {
      filtered = filtered.filter(p => p.isLinked);
    } else if (filter === 'unlinked') {
      filtered = filtered.filter(p => !p.isLinked);
    }

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.email && p.email.toLowerCase().includes(s)) ||
        (p.phone && p.phone.toLowerCase().includes(s)) ||
        (p.username && p.username.toLowerCase().includes(s)) ||
        (p.linkedChildren && p.linkedChildren.some(c =>
          c.fullName.toLowerCase().includes(s) ||
          c.studentId.toLowerCase().includes(s)
        ))
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      stats: {
        totalParents,
        linkedParents,
        unlinkedParents,
        totalRelationships
      },
      data: filtered
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parent by ID with complete details & child academic stats
// @route   GET /api/parents/:id
// @access  Private (Admin only)
exports.getParentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let parent = null;

    if (getMongoStatus()) {
      parent = await User.findOne({ _id: id, role: 'parent' }).select('-password').lean();
    } else {
      parent = await Storage.users.findById(id);
      if (parent && parent.role !== 'parent') parent = null;
    }

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: `Parent with ID "${id}" not found.`
      });
    }

    const allStudents = await Storage.students.find({});
    const allowedIds = (parent.studentIds || []).map(sid => String(sid).toUpperCase());
    const pIdStr = String(parent._id).toUpperCase();
    const pEmail = (parent.email || '').toLowerCase();

    const children = allStudents.filter(s =>
      allowedIds.includes(String(s._id).toUpperCase()) ||
      allowedIds.includes(String(s.studentId).toUpperCase()) ||
      (s.parentId && String(s.parentId).toUpperCase() === pIdStr) ||
      (s.parentEmail && s.parentEmail.toLowerCase() === pEmail)
    );

    // Populate child metrics (attendance and fees)
    const childrenDetails = [];
    for (const child of children) {
      const attStats = await Storage.attendance.getStats({ studentId: child.studentId });
      const childFees = await Storage.fees.find({ studentId: child.studentId });
      const childObj = child.toObject ? child.toObject() : { ...child };

      childrenDetails.push({
        ...childObj,
        attendanceStats: attStats,
        feeRecords: childFees
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...parent,
        linkedChildrenCount: childrenDetails.length,
        isLinked: childrenDetails.length > 0,
        linkedChildren: childrenDetails
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new Parent account
// @route   POST /api/parents
// @access  Private (Admin only)
exports.createParent = async (req, res, next) => {
  try {
    const { name, email, phone, password, address, studentIds, studentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Parent full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await Storage.users.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${cleanEmail}" already exists!`
      });
    }

    // Generate unique username
    let username = req.body.username ? req.body.username.trim().toLowerCase() : cleanEmail.split('@')[0];
    const existingUsername = await Storage.users.findOne({ username });
    if (existingUsername) {
      username = `${username}_${Math.floor(Math.random() * 899 + 100)}`;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Resolve initial student IDs if provided
    let linkedMongoIds = [];
    const rawStudentIds = [];
    if (studentId) rawStudentIds.push(studentId);
    if (Array.isArray(studentIds)) rawStudentIds.push(...studentIds);
    else if (typeof studentIds === 'string' && studentIds.trim()) {
      rawStudentIds.push(...studentIds.split(',').map(s => s.trim()));
    }

    for (const sid of rawStudentIds) {
      const stu = await Storage.students.findById(sid) || await Storage.students.findByStudentId(sid);
      if (stu && !linkedMongoIds.some(id => String(id) === String(stu._id))) {
        linkedMongoIds.push(stu._id);
      }
    }

    // Create user document
    const parentData = {
      name: name.trim(),
      email: cleanEmail,
      username,
      password: hashedPassword,
      role: 'parent',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      studentIds: linkedMongoIds,
      status: req.body.status === 'inactive' ? 'inactive' : 'active'
    };

    const newParent = await Storage.users.create(parentData);

    // Update students with parent reference
    for (const sMongoId of linkedMongoIds) {
      await Storage.students.updateById(sMongoId, {
        parentId: newParent._id,
        parentName: newParent.name,
        parentEmail: newParent.email
      });
    }

    await logAudit('CREATE', `Created parent account for ${newParent.name} (${newParent.email})`, req.user);

    const safeParent = newParent.toObject ? newParent.toObject() : { ...newParent };
    delete safeParent.password;

    res.status(201).json({
      success: true,
      message: `Parent account for "${newParent.name}" created successfully.`,
      data: safeParent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Parent Account details
// @route   PUT /api/parents/:id
// @access  Private (Admin only)
exports.updateParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status, password } = req.body;

    const parent = await Storage.users.findById(id);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ success: false, message: `Parent with ID "${id}" not found.` });
    }

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (status) updateData.status = status;

    if (email && email.trim().toLowerCase() !== parent.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const duplicate = await Storage.users.findOne({ email: cleanEmail });
      if (duplicate && String(duplicate._id) !== String(id)) {
        return res.status(400).json({ success: false, message: `Email "${cleanEmail}" is already in use by another account.` });
      }
      updateData.email = cleanEmail;
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await Storage.users.updateById(id, updateData);

    // Synchronize parent name & email on linked students if changed
    if (updateData.name || updateData.email) {
      const studentUpdate = {};
      if (updateData.name) studentUpdate.parentName = updateData.name;
      if (updateData.email) studentUpdate.parentEmail = updateData.email;

      if (getMongoStatus()) {
        await Student.updateMany({ parentId: id }, { $set: studentUpdate });
      }
    }

    await logAudit('UPDATE', `Updated parent profile for ${updated.name} (${updated.email})`, req.user);

    const safeParent = updated.toObject ? updated.toObject() : { ...updated };
    delete safeParent.password;

    res.status(200).json({
      success: true,
      message: 'Parent profile updated successfully.',
      data: safeParent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Parent Account
// @route   DELETE /api/parents/:id
// @access  Private (Admin only)
exports.deleteParent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const parent = await Storage.users.findById(id);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ success: false, message: `Parent with ID "${id}" not found.` });
    }

    // Unlink all associated students before deletion (do NOT delete students)
    if (getMongoStatus()) {
      await Student.updateMany(
        { parentId: id },
        { $unset: { parentId: 1, parentName: 1, parentEmail: 1 } }
      );
    } else {
      const allStudents = await Storage.students.find({});
      for (const s of allStudents) {
        if (String(s.parentId) === String(id)) {
          await Storage.students.updateById(s._id, { parentId: null, parentName: null, parentEmail: null });
        }
      }
    }

    await Storage.users.deleteById(id);
    await logAudit('DELETE', `Deleted parent account ${parent.name} (${parent.email})`, req.user);

    res.status(200).json({
      success: true,
      message: `Parent "${parent.name}" deleted successfully. Associated student records have been unlinked safely.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Link an existing Student to a Parent
// @route   POST /api/parents/:id/link-student
// @access  Private (Admin only)
exports.linkStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId || !studentId.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Student ID to link.' });
    }

    // 1. Verify Parent exists
    let parent = null;
    if (getMongoStatus()) {
      parent = await User.findOne({ _id: id, role: 'parent' });
    } else {
      parent = await Storage.users.findById(id);
      if (parent && parent.role !== 'parent') parent = null;
    }

    if (!parent) {
      return res.status(404).json({ success: false, message: `Parent with ID "${id}" not found.` });
    }

    // 2. Verify Student exists
    const cleanStudentId = studentId.trim();
    let student = await Storage.students.findByStudentId(cleanStudentId);
    if (!student) {
      student = await Storage.students.findById(cleanStudentId);
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student "${cleanStudentId}" not found in institutional database.`
      });
    }

    const sMongoIdStr = String(student._id);
    const existingLinks = (parent.studentIds || []).map(sid => String(sid));

    // 3. Prevent duplicate relationship
    if (existingLinks.includes(sMongoIdStr)) {
      return res.status(400).json({
        success: false,
        message: `Student "${student.fullName}" (${student.studentId}) is already linked to parent "${parent.name}".`
      });
    }

    // 4. Update Parent document with student reference
    existingLinks.push(student._id);
    parent.studentIds = existingLinks;

    if (getMongoStatus()) {
      await User.findByIdAndUpdate(parent._id, { $addToSet: { studentIds: student._id } });
    } else {
      await Storage.users.updateById(parent._id, { studentIds: existingLinks });
    }

    // 5. Update Student document with parent reference
    await Storage.students.updateById(student._id, {
      parentId: parent._id,
      parentName: parent.name,
      parentEmail: parent.email
    });

    await logAudit(
      'LINK_RELATIONSHIP',
      `Linked student ${student.fullName} (${student.studentId}) to parent ${parent.name} (${parent.email})`,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Successfully linked ${student.fullName} (${student.studentId}) to parent ${parent.name}.`,
      data: {
        parentId: parent._id,
        parentName: parent.name,
        studentId: student.studentId,
        studentName: student.fullName
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlink a Student from a Parent
// @route   DELETE /api/parents/:id/unlink-student/:studentId
// @access  Private (Admin only)
exports.unlinkStudent = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;

    // 1. Verify Parent exists
    const parent = await Storage.users.findById(id);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ success: false, message: `Parent with ID "${id}" not found.` });
    }

    // 2. Find Student
    let student = await Storage.students.findByStudentId(studentId);
    if (!student) {
      student = await Storage.students.findById(studentId);
    }

    if (!student) {
      return res.status(404).json({ success: false, message: `Student "${studentId}" not found.` });
    }

    const sMongoIdStr = String(student._id);
    const sCustomIdStr = String(student.studentId).toUpperCase();

    // 3. Remove student reference from parent
    if (getMongoStatus()) {
      await User.findByIdAndUpdate(parent._id, {
        $pull: { studentIds: student._id }
      });
      await Student.findByIdAndUpdate(student._id, {
        $unset: { parentId: 1, parentName: 1, parentEmail: 1 }
      });
    } else {
      const remaining = (parent.studentIds || []).filter(
        sid => String(sid) !== sMongoIdStr && String(sid).toUpperCase() !== sCustomIdStr
      );
      await Storage.users.updateById(parent._id, { studentIds: remaining });
      await Storage.students.updateById(student._id, {
        parentId: null,
        parentName: null,
        parentEmail: null
      });
    }

    await logAudit(
      'UNLINK_RELATIONSHIP',
      `Unlinked student ${student.fullName} (${student.studentId}) from parent ${parent.name}`,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Successfully unlinked ${student.fullName} (${student.studentId}) from parent ${parent.name}.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get linked children for currently logged-in parent
// @route   GET /api/parent/children
// @access  Private (Parent only)
exports.getMyChildren = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only parents can access linked children records.'
      });
    }

    const allowedIds = (user.studentIds || []).map(id => String(id).toUpperCase());
    const allStudents = await Storage.students.find({});
    const pIdStr = String(user._id).toUpperCase();
    const pEmail = (user.email || '').toLowerCase();

    const children = allStudents.filter(s =>
      allowedIds.includes(String(s._id).toUpperCase()) ||
      allowedIds.includes(String(s.studentId).toUpperCase()) ||
      (s.parentId && String(s.parentId).toUpperCase() === pIdStr) ||
      (s.parentEmail && s.parentEmail.toLowerCase() === pEmail)
    );

    const today = new Date().toISOString().split('T')[0];
    const childrenDetails = [];

    for (const child of children) {
      const attStats = await Storage.attendance.getStats({ studentId: child.studentId });
      const childFees = await Storage.fees.find({ studentId: child.studentId });
      const todayAtt = await Storage.attendance.find({ studentId: child.studentId, date: today });
      const childObj = child.toObject ? child.toObject() : { ...child };

      childrenDetails.push({
        ...childObj,
        attendanceStats: attStats,
        feeRecords: childFees,
        todayStatus: todayAtt.length > 0 ? todayAtt[0].status : 'Not Marked'
      });
    }

    res.status(200).json({
      success: true,
      count: childrenDetails.length,
      parentName: user.name,
      data: childrenDetails
    });
  } catch (err) {
    next(err);
  }
};
