const Storage = require('../utils/storage');

// @desc    Get attendance records (with filters)
// @route   GET /api/attendance
// @access  Private (Admin, Teacher, Parent)
exports.getAttendance = async (req, res, next) => {
  try {
    const { date, className, section, studentId, status, startDate, endDate } = req.query;
    const user = req.user;

    const query = {
      date,
      className,
      section,
      studentId,
      status,
      startDate,
      endDate
    };

    // If student, restrict to own attendance
    if (user.role === 'student') {
      const myStudentId = (user.studentId || '').toUpperCase();
      let records = await Storage.attendance.find({ ...query, studentId: myStudentId });
      records = records.filter(r => String(r.studentId).toUpperCase() === myStudentId);
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    }

    // If parent, restrict to their children
    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(id => String(id).toUpperCase());
      let records = await Storage.attendance.find(query);
      records = records.filter(r => allowedIds.includes(String(r.studentId).toUpperCase()));
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    }

    const records = await Storage.attendance.find(query);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance statistics (Summary)
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const { date, className, section } = req.query;
    let studentId = req.query.studentId;

    if (req.user && req.user.role === 'student') {
      studentId = req.user.studentId;
    }

    const stats = await Storage.attendance.getStats({ date, className, section, studentId });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark individual student attendance
// @route   POST /api/attendance
// @access  Private (Admin, Teacher)
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Student ID, Date (YYYY-MM-DD), and Attendance Status'
      });
    }

    const student = await Storage.students.findByStudentId(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${studentId}" not found.`
      });
    }

    const record = await Storage.attendance.markRecord({
      student: student._id,
      studentId: student.studentId,
      studentName: student.fullName,
      className: student.className,
      section: student.section,
      date,
      status,
      remarks: remarks || '',
      markedBy: req.user.name || 'Admin'
    });

    res.status(201).json({
      success: true,
      message: `Attendance for ${student.fullName} recorded as "${status}".`,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark bulk class attendance
// @route   POST /api/attendance/bulk
// @access  Private (Admin, Teacher)
exports.markBulkAttendance = async (req, res, next) => {
  try {
    const { date, className, section, records } = req.body;

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance date and list of student records'
      });
    }

    const formattedRecords = [];
    for (const r of records) {
      formattedRecords.push({
        student: r.studentId,
        studentId: r.studentId,
        studentName: r.studentName,
        className: className || r.className,
        section: section || r.section,
        date,
        status: r.status || 'Present',
        remarks: r.remarks || '',
        markedBy: req.user.name || 'Admin'
      });
    }

    const savedRecords = await Storage.attendance.markBatch(formattedRecords);

    res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${savedRecords.length} students on ${date}!`,
      count: savedRecords.length,
      data: savedRecords
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Admin, Teacher)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.attendance.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Attendance entry "${id}" not found`
      });
    }

    const updated = await Storage.attendance.updateById(existing._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin only)
exports.deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.attendance.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Attendance entry "${id}" not found`
      });
    }

    await Storage.attendance.deleteById(existing._id);

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully!'
    });
  } catch (err) {
    next(err);
  }
};

