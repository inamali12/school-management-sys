const Storage = require('../utils/storage');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin, Teacher)
exports.getTeachers = async (req, res, next) => {
  try {
    const { status, subject, assignedClass, search } = req.query;

    const teachers = await Storage.teachers.find({
      status,
      subject,
      assignedClass,
      search
    });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacherById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Storage.teachers.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher with ID "${id}" not found`
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate next unique Teacher ID
// @route   GET /api/teachers/generate/next-id
// @access  Private (Admin)
exports.generateTeacherId = async (req, res, next) => {
  try {
    const nextId = await Storage.teachers.getNextTeacherId();
    res.status(200).json({
      success: true,
      teacherId: nextId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a new teacher
// @route   POST /api/teachers
// @access  Private (Admin only)
exports.createTeacher = async (req, res, next) => {
  try {
    const {
      teacherId,
      fullName,
      email,
      phoneNumber,
      qualification,
      subject,
      assignedSubjects,
      assignedClass,
      assignedClasses,
      joiningDate,
      salary,
      address,
      status,
      cnic,
      photoUrl
    } = req.body;

    if (!fullName || !email || !phoneNumber || !qualification || !subject || !salary || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields: Full Name, Email, Phone Number, Qualification, Subject, Salary, and Address.'
      });
    }

    const finalTeacherId = (teacherId && teacherId.trim())
      ? teacherId.trim().toUpperCase()
      : await Storage.teachers.getNextTeacherId();

    const existing = await Storage.teachers.findById(finalTeacherId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Teacher with ID "${finalTeacherId}" already exists.`
      });
    }

    // Process subjects array
    let subjectsList = [];
    if (Array.isArray(assignedSubjects)) {
      subjectsList = assignedSubjects;
    } else if (typeof assignedSubjects === 'string' && assignedSubjects.trim()) {
      subjectsList = assignedSubjects.split(',').map(s => s.trim());
    }
    if (!subjectsList.includes(subject)) {
      subjectsList.unshift(subject);
    }

    // Process classes array
    let classesList = [];
    if (Array.isArray(assignedClasses)) {
      classesList = assignedClasses;
    } else if (typeof assignedClasses === 'string' && assignedClasses.trim()) {
      classesList = assignedClasses.split(',').map(c => c.trim());
    }
    if (assignedClass && !classesList.includes(assignedClass)) {
      classesList.unshift(assignedClass);
    }

    const newTeacher = await Storage.teachers.create({
      teacherId: finalTeacherId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      qualification: qualification.trim(),
      subject: subject.trim(),
      assignedSubjects: subjectsList,
      assignedClass: assignedClass || 'None',
      assignedClasses: classesList,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      salary: Number(salary) || 35000,
      address: address.trim(),
      status: status || 'Active',
      cnic: cnic ? cnic.trim() : '',
      photoUrl: photoUrl || ''
    });

    res.status(201).json({
      success: true,
      message: `Teacher "${newTeacher.fullName}" (${newTeacher.teacherId}) added successfully!`,
      data: newTeacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update teacher information
// @route   PUT /api/teachers/:id
// @access  Private (Admin only)
exports.updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.teachers.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Teacher with ID "${id}" not found`
      });
    }

    const updatePayload = { ...req.body };

    if (updatePayload.assignedSubjects && typeof updatePayload.assignedSubjects === 'string') {
      updatePayload.assignedSubjects = updatePayload.assignedSubjects.split(',').map(s => s.trim());
    }
    if (updatePayload.assignedClasses && typeof updatePayload.assignedClasses === 'string') {
      updatePayload.assignedClasses = updatePayload.assignedClasses.split(',').map(c => c.trim());
    }

    const updated = await Storage.teachers.updateById(existing._id, updatePayload);

    res.status(200).json({
      success: true,
      message: `Teacher details updated successfully!`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin only)
exports.deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.teachers.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Teacher with ID "${id}" not found`
      });
    }

    await Storage.teachers.deleteById(existing._id);

    res.status(200).json({
      success: true,
      message: `Teacher "${existing.fullName}" (${existing.teacherId}) deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};

