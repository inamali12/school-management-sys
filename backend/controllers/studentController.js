const Storage = require('../utils/storage');

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

    res.status(200).json({
      success: true,
      data: {
        ...student,
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

    res.status(200).json({
      success: true,
      message: `Student "${existing.fullName}" (${existing.studentId}) deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};

