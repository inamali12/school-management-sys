const Storage = require('../utils/storage');
const User = require('../models/User');
const Student = require('../models/Student');
const { getMongoStatus } = require('../config/db');

// @desc    Get all students (with search & filters)
// @route   GET /api/students
// @access  Private (Admin, Teacher, Parent)
exports.getStudents = async (req, res, next) => {
  try {
    const { className, section, status, gender, search } = req.query;
    const user = req.user;

    let students = await Storage.students.find({
      className,
      section,
      status,
      gender,
      search
    });

    // Student role restriction: only see own profile
    if (user.role === 'student') {
      const myStudentId = (user.studentId || '').toUpperCase();
      students = students.filter(s =>
        (user.studentRef && String(s._id) === String(user.studentRef)) ||
        (myStudentId && String(s.studentId).toUpperCase() === myStudentId)
      );
    }

    // Parent role restriction: only see linked children
    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(id => String(id).toUpperCase());
      students = students.filter(s =>
        allowedIds.includes(String(s._id).toUpperCase()) ||
        allowedIds.includes(String(s.studentId).toUpperCase())
      );
    }

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const student = await Storage.students.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    // Role check for Student
    if (user.role === 'student') {
      const myStudentId = (user.studentId || '').toUpperCase();
      const matchesRef = user.studentRef && String(user.studentRef) === String(student._id);
      const matchesId = myStudentId && String(student.studentId).toUpperCase() === myStudentId;
      if (!matchesRef && !matchesId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are only allowed to view your own student record.'
        });
      }
    }

    // Role check for Parent
    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(sid => String(sid).toUpperCase());
      const isAllowed = allowedIds.includes(String(student._id).toUpperCase()) ||
                        allowedIds.includes(String(student.studentId).toUpperCase());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are only allowed to view records for your linked child.'
        });
      }
    }

    // Fetch student's attendance summary & fees
    const attendanceStats = await Storage.attendance.getStats({ studentId: student.studentId });
    const feeRecords = await Storage.fees.find({ studentId: student.studentId });
    const studentObj = student.toObject ? student.toObject() : { ...student };

    // Look up linked parent details if any
    let linkedParent = null;
    if (studentObj.parentId) {
      const p = await Storage.users.findById(studentObj.parentId);
      if (p) {
        linkedParent = { _id: p._id, name: p.name, email: p.email, phone: p.phone };
      }
    }
    if (!linkedParent) {
      const parents = await Storage.users.find({ role: 'parent' });
      const matched = parents.find(p => (p.studentIds || []).some(sid => String(sid) === String(studentObj._id) || String(sid).toUpperCase() === String(studentObj.studentId).toUpperCase()));
      if (matched) {
        linkedParent = { _id: matched._id, name: matched.name, email: matched.email, phone: matched.phone };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...studentObj,
        linkedParent,
        attendanceStats,
        feeRecords
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate next unique Student ID
// @route   GET /api/students/generate/next-id
// @access  Private (Admin)
exports.generateStudentId = async (req, res, next) => {
  try {
    const nextId = await Storage.students.getNextStudentId();
    res.status(200).json({
      success: true,
      studentId: nextId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Admin only)
exports.createStudent = async (req, res, next) => {
  try {
    const {
      studentId,
      fullName,
      fatherName,
      dob,
      gender,
      className,
      section,
      rollNumber,
      contactNumber,
      parentContact,
      address,
      admissionDate,
      photoUrl,
      status,
      bFormOrCnic,
      monthlyTuitionFee,
      emergencyContact
    } = req.body;

    // Required fields validation
    if (!fullName || !fatherName || !className || !section || !contactNumber || !parentContact || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields: Full Name, Father Name, Class, Section, Student Contact, Parent Contact, and Address.'
      });
    }

    // Auto-generate studentId if not provided
    const finalStudentId = (studentId && studentId.trim()) 
      ? studentId.trim().toUpperCase() 
      : await Storage.students.getNextStudentId();

    // Check duplicate studentId
    const existing = await Storage.students.findByStudentId(finalStudentId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student with ID "${finalStudentId}" already exists. Please use a unique ID.`
      });
    }

    const newStudent = await Storage.students.create({
      studentId: finalStudentId,
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      dob: dob || '2010-01-01',
      gender: gender || 'Male',
      className: className.trim(),
      section: (section || 'A').trim().toUpperCase(),
      rollNumber: rollNumber ? rollNumber.trim() : '',
      contactNumber: contactNumber.trim(),
      parentContact: parentContact.trim(),
      address: address.trim(),
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      photoUrl: photoUrl || '',
      status: status || 'Active',
      bFormOrCnic: bFormOrCnic ? bFormOrCnic.trim() : '',
      monthlyTuitionFee: Number(monthlyTuitionFee) || 3000,
      emergencyContact: emergencyContact ? emergencyContact.trim() : parentContact.trim()
    });

    await Storage.activities.create({
      title: 'New Student Admission',
      description: `Enrolled student ${newStudent.fullName} (${newStudent.studentId}) in Class ${newStudent.className}-${newStudent.section}`,
      type: 'admission',
      performedBy: req.user ? req.user.name : 'Administrator',
      role: req.user ? req.user.role : 'admin',
      metadata: { studentId: newStudent.studentId, className: newStudent.className }
    });

    res.status(201).json({
      success: true,
      message: `Student "${newStudent.fullName}" (${newStudent.studentId}) added successfully!`,
      data: newStudent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin only)
exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.students.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    const updated = await Storage.students.updateById(existing._id, req.body);

    await Storage.activities.create({
      title: 'Student Profile Updated',
      description: `Updated record for ${updated.fullName} (${updated.studentId})`,
      type: 'system',
      performedBy: req.user ? req.user.name : 'Administrator',
      role: req.user ? req.user.role : 'admin',
      metadata: { studentId: updated.studentId }
    });

    res.status(200).json({
      success: true,
      message: `Student details updated successfully!`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.students.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${id}" not found`
      });
    }

    await Storage.students.deleteById(existing._id);

    await Storage.activities.create({
      title: 'Student Record Removed',
      description: `Deleted student ${existing.fullName} (${existing.studentId})`,
      type: 'system',
      performedBy: req.user ? req.user.name : 'Administrator',
      role: req.user ? req.user.role : 'admin',
      metadata: { studentId: existing.studentId }
    });

    res.status(200).json({
      success: true,
      message: `Student "${existing.fullName}" (${existing.studentId}) deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Link Parent to Student
// @route   POST /api/students/:id/link-parent
// @access  Private (Admin only)
exports.linkParent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentId, parentEmail } = req.body;

    const student = await Storage.students.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: `Student "${id}" not found.` });
    }

    let parent = null;
    if (parentId) {
      parent = await Storage.users.findById(parentId);
    } else if (parentEmail) {
      parent = await Storage.users.findOne({ email: parentEmail.trim().toLowerCase(), role: 'parent' });
    }

    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ success: false, message: 'Valid Parent account not found.' });
    }

    // Update Student & Parent bidirectionally
    if (getMongoStatus()) {
      await User.findByIdAndUpdate(parent._id, {
        $addToSet: { studentIds: student._id }
      });
      await Student.findByIdAndUpdate(student._id, {
        parentId: parent._id,
        parentName: parent.name,
        parentEmail: parent.email
      });
    } else {
      await Storage.students.updateById(student._id, {
        parentId: parent._id,
        parentName: parent.name,
        parentEmail: parent.email
      });

      const sMongoIdStr = String(student._id);
      const existingLinks = (parent.studentIds || []).map(sid => String(sid));
      if (!existingLinks.includes(sMongoIdStr)) {
        existingLinks.push(student._id);
        await Storage.users.updateById(parent._id, { studentIds: existingLinks });
      }
    }

    res.status(200).json({
      success: true,
      message: `Linked student ${student.fullName} to parent ${parent.name}.`,
      data: {
        parentId: parent._id,
        parentName: parent.name,
        parentEmail: parent.email
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unlink Parent from Student
// @route   DELETE /api/students/:id/unlink-parent
// @access  Private (Admin only)
exports.unlinkParent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Storage.students.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: `Student "${id}" not found.` });
    }

    if (getMongoStatus()) {
      await User.updateMany(
        { studentIds: student._id },
        { $pull: { studentIds: student._id } }
      );
      if (student.parentId) {
        await User.findByIdAndUpdate(student.parentId, {
          $pull: { studentIds: student._id }
        });
      }
      await Student.findByIdAndUpdate(student._id, {
        $unset: { parentId: 1, parentName: 1, parentEmail: 1 }
      });
    } else {
      if (student.parentId) {
        const parent = await Storage.users.findById(student.parentId);
        if (parent) {
          const sMongoIdStr = String(student._id);
          const remaining = (parent.studentIds || []).filter(sid => String(sid) !== sMongoIdStr && String(sid).toUpperCase() !== String(student.studentId).toUpperCase());
          await Storage.users.updateById(parent._id, { studentIds: remaining });
        }
      }
      await Storage.students.updateById(student._id, {
        parentId: null,
        parentName: null,
        parentEmail: null
      });
    }

    res.status(200).json({
      success: true,
      message: `Unlinked parent from student ${student.fullName}.`
    });
  } catch (err) {
    next(err);
  }
};

