const Storage = require('../utils/storage');

// @desc    Generate Student Admissions Report
// @route   GET /api/reports/students
// @access  Private (Admin)
exports.getStudentReport = async (req, res, next) => {
  try {
    const { className, gender, status, startDate, endDate } = req.query;

    let students = await Storage.students.find({
      className: className !== 'all' ? className : undefined,
      gender: gender !== 'all' ? gender : undefined,
      status: status !== 'all' ? status : undefined
    });

    if (startDate && endDate) {
      students = students.filter(s => s.admissionDate >= startDate && s.admissionDate <= endDate);
    }

    res.status(200).json({
      success: true,
      reportType: 'Student Admissions Report',
      generatedAt: new Date().toISOString(),
      totalRecords: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Daily Attendance Report
// @route   GET /api/reports/attendance-daily
// @access  Private (Admin, Teacher)
exports.getDailyAttendanceReport = async (req, res, next) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const { className, section } = req.query;

    const records = await Storage.attendance.find({
      date: targetDate,
      className: className !== 'all' ? className : undefined,
      section: section !== 'all' ? section : undefined
    });

    const stats = await Storage.attendance.getStats({
      date: targetDate,
      className: className !== 'all' ? className : undefined,
      section: section !== 'all' ? section : undefined
    });

    res.status(200).json({
      success: true,
      reportType: `Daily Attendance Report (${targetDate})`,
      date: targetDate,
      stats,
      totalRecords: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Monthly Attendance Report
// @route   GET /api/reports/attendance-monthly
// @access  Private (Admin, Teacher)
exports.getMonthlyAttendanceReport = async (req, res, next) => {
  try {
    const { className, month, year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `${currentYear}-${currentMonth}`;

    const students = await Storage.students.find({
      className: className !== 'all' ? className : undefined
    });

    const allRecords = await Storage.attendance.find({
      className: className !== 'all' ? className : undefined
    });

    const monthRecords = allRecords.filter(r => r.date && r.date.startsWith(prefix));

    // Aggregate student wise
    const studentSummary = students.map(student => {
      const stuRecords = monthRecords.filter(r => r.studentId === student.studentId);
      const present = stuRecords.filter(r => r.status === 'Present').length;
      const late = stuRecords.filter(r => r.status === 'Late').length;
      const absent = stuRecords.filter(r => r.status === 'Absent').length;
      const leave = stuRecords.filter(r => r.status === 'Leave').length;
      const total = stuRecords.length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        section: student.section,
        totalDays: total,
        present,
        late,
        absent,
        leave,
        percentage
      };
    });

    res.status(200).json({
      success: true,
      reportType: `Monthly Attendance Report (${prefix})`,
      month: prefix,
      totalStudents: studentSummary.length,
      data: studentSummary
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Monthly Fee Collection Report
// @route   GET /api/reports/fees-collection
// @access  Private (Admin only)
exports.getFeeCollectionReport = async (req, res, next) => {
  try {
    const { month, className } = req.query;

    const fees = await Storage.fees.find({
      month: month !== 'all' ? month : undefined,
      className: className !== 'all' ? className : undefined
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const methodBreakdown = {
      Cash: 0,
      JazzCash: 0,
      EasyPaisa: 0,
      'Bank Transfer': 0,
      Cheque: 0
    };

    for (const f of fees) {
      totalBilled += Number(f.totalFee) || 0;
      totalCollected += Number(f.paidAmount) || 0;
      totalOutstanding += Number(f.remainingBalance) || 0;

      if (f.payments && Array.isArray(f.payments)) {
        for (const p of f.payments) {
          const method = p.paymentMethod || 'Cash';
          methodBreakdown[method] = (methodBreakdown[method] || 0) + Number(p.amount);
        }
      }
    }

    res.status(200).json({
      success: true,
      reportType: `Fee Collection Report - ${month || 'All Months'}`,
      summary: {
        totalVouchers: fees.length,
        totalBilled,
        totalCollected,
        totalOutstanding,
        collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
        methodBreakdown
      },
      data: fees
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Fee Defaulters / Outstanding Dues Report
// @route   GET /api/reports/fees-defaulters
// @access  Private (Admin only)
exports.getFeeDefaultersReport = async (req, res, next) => {
  try {
    const { className, month } = req.query;

    let fees = await Storage.fees.find({
      className: className !== 'all' ? className : undefined,
      month: month !== 'all' ? month : undefined
    });

    // Filter only those with remaining balance > 0
    const defaulters = fees
      .filter(f => Number(f.remainingBalance) > 0)
      .map(f => ({
        feeId: f.feeId,
        studentId: f.studentId,
        studentName: f.studentName,
        className: f.className,
        section: f.section,
        month: f.month,
        dueDate: f.dueDate,
        totalFee: f.totalFee,
        paidAmount: f.paidAmount,
        remainingBalance: f.remainingBalance,
        status: f.paymentStatus
      }))
      .sort((a, b) => b.remainingBalance - a.remainingBalance);

    const totalDefaulterAmount = defaulters.reduce((acc, curr) => acc + curr.remainingBalance, 0);

    res.status(200).json({
      success: true,
      reportType: 'Fee Defaulters & Outstanding Dues Report',
      totalDefaulters: defaulters.length,
      totalOutstandingDues: totalDefaulterAmount,
      data: defaulters
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Teacher Staff Report
// @route   GET /api/reports/teachers
// @access  Private (Admin only)
exports.getTeacherReport = async (req, res, next) => {
  try {
    const teachers = await Storage.teachers.find({});
    const totalPayroll = teachers.reduce((acc, t) => acc + (Number(t.salary) || 0), 0);

    res.status(200).json({
      success: true,
      reportType: 'Teacher Staff & Payroll Report',
      totalStaff: teachers.length,
      totalMonthlyPayroll: totalPayroll,
      data: teachers
    });
  } catch (err) {
    next(err);
  }
};

