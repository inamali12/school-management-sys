const Storage = require('../utils/storage');

// @desc    Get all classes with student counts
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await Storage.classes.find();
    const students = await Storage.students.find({});

    // Attach real student count per class
    const enrichedClasses = classes.map(c => {
      const classStudents = students.filter(s => s.className.toLowerCase() === c.name.toLowerCase());
      return {
        ...c,
        studentCount: classStudents.length
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedClasses.length,
      data: enrichedClasses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private
exports.getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classItem = await Storage.classes.findById(id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: `Class "${id}" not found`
      });
    }

    const students = await Storage.students.find({ className: classItem.name });

    res.status(200).json({
      success: true,
      data: {
        ...classItem,
        students,
        studentCount: students.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin only)
exports.createClass = async (req, res, next) => {
  try {
    const {
      name,
      numericGrade,
      sections,
      classTeacherName,
      monthlyTuitionFee,
      roomNumber,
      capacity,
      subjects,
      academicYear
    } = req.body;

    if (!name || !numericGrade) {
      return res.status(400).json({
        success: false,
        message: 'Please provide class name and numeric grade'
      });
    }

    let parsedSections = ['A'];
    if (Array.isArray(sections)) {
      parsedSections = sections;
    } else if (typeof sections === 'string' && sections.trim()) {
      parsedSections = sections.split(',').map(s => s.trim().toUpperCase());
    }

    let parsedSubjects = ['English', 'Mathematics', 'General Science', 'Urdu', 'Islamiat'];
    if (Array.isArray(subjects)) {
      parsedSubjects = subjects;
    } else if (typeof subjects === 'string' && subjects.trim()) {
      parsedSubjects = subjects.split(',').map(s => s.trim());
    }

    const newClass = await Storage.classes.create({
      name: name.trim(),
      numericGrade: Number(numericGrade),
      sections: parsedSections,
      classTeacherName: classTeacherName ? classTeacherName.trim() : 'Unassigned',
      monthlyTuitionFee: Number(monthlyTuitionFee) || 3000,
      roomNumber: roomNumber ? roomNumber.trim() : 'Room 101',
      capacity: Number(capacity) || 40,
      subjects: parsedSubjects,
      academicYear: academicYear || '2025-2026'
    });

    res.status(201).json({
      success: true,
      message: `Class "${newClass.name}" created successfully!`,
      data: newClass
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update class details
// @route   PUT /api/classes/:id
// @access  Private (Admin only)
exports.updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.classes.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Class "${id}" not found`
      });
    }

    const updatePayload = { ...req.body };
    if (updatePayload.sections && typeof updatePayload.sections === 'string') {
      updatePayload.sections = updatePayload.sections.split(',').map(s => s.trim().toUpperCase());
    }
    if (updatePayload.subjects && typeof updatePayload.subjects === 'string') {
      updatePayload.subjects = updatePayload.subjects.split(',').map(s => s.trim());
    }

    const updated = await Storage.classes.updateById(existing._id, updatePayload);

    res.status(200).json({
      success: true,
      message: `Class "${updated.name}" updated successfully!`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin only)
exports.deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.classes.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Class "${id}" not found`
      });
    }

    await Storage.classes.deleteById(existing._id);

    res.status(200).json({
      success: true,
      message: `Class "${existing.name}" deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};
