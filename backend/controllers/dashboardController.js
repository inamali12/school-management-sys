const Storage = require('../utils/storage');

// @desc    Get complete real-time dashboard analytics
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Teacher, Parent)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const today = new Date().toISOString().split('T')[0];

    // If Parent, return customized parent dashboard data
    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(id => String(id).toUpperCase());
      const allStudents = await Storage.students.find({});
      const children = allStudents.filter(s => allowedIds.includes(String(s.studentId).toUpperCase()));

      const childrenDetails = [];
      for (const child of children) {
        const attStats = await Storage.attendance.getStats({ studentId: child.studentId });
        const childFees = await Storage.fees.find({ studentId: child.studentId });
        const todayAtt = await Storage.attendance.find({ studentId: child.studentId, date: today });

        childrenDetails.push({
          ...child,
          attendanceStats: attStats,
          feeRecords: childFees,
          todayStatus: todayAtt.length > 0 ? todayAtt[0].status : 'Not Marked'
        });
      }

      return res.status(200).json({
        success: true,
        role: 'parent',
        parentName: user.name,
        childrenCount: children.length,
        children: childrenDetails
      });
    }

    // If Teacher, return customized teacher dashboard data
    if (user.role === 'teacher') {
      const teacher = await Storage.teachers.findById(user.teacherRef) ||
                      await Storage.teachers.findOne({ email: user.email });
      
      const assignedClass = teacher ? teacher.assignedClass : 'None';
      const assignedClasses = teacher ? (teacher.assignedClasses || [assignedClass]) : [];
      
      const students = await Storage.students.find({});
      const myStudents = students.filter(s => assignedClasses.includes(s.className));
      const todayAttendance = await Storage.attendance.find({ date: today });
      const myTodayAtt = todayAttendance.filter(a => assignedClasses.includes(a.className));

      const presentCount = myTodayAtt.filter(a => a.status === 'Present').length;
      const absentCount = myTodayAtt.filter(a => a.status === 'Absent').length;
      const lateCount = myTodayAtt.filter(a => a.status === 'Late').length;
      const leaveCount = myTodayAtt.filter(a => a.status === 'Leave').length;

      return res.status(200).json({
        success: true,
        role: 'teacher',
        teacherProfile: teacher,
        assignedClasses,
        totalAssignedStudents: myStudents.length,
        todayAttendance: {
          markedTotal: myTodayAtt.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          leave: leaveCount,
          attendanceRate: myTodayAtt.length > 0 ? Math.round(((presentCount + lateCount) / myTodayAtt.length) * 100) : 0
        },
        myStudents: myStudents.slice(0, 10)
      });
    }

    // ADMIN DASHBOARD (Complete Real-time Aggregation)
    const [totalStudents, totalTeachers, totalClasses, todayAttendanceList, feeStats, allStudents, allFees] = await Promise.all([
      Storage.students.count({ status: 'Active' }),
      Storage.teachers.count({ status: 'Active' }),
      Storage.classes.count(),
      Storage.attendance.find({ date: today }),
      Storage.fees.getStats(),
      Storage.students.find({}),
      Storage.fees.find({})
    ]);

    // Attendance breakdown for today
    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;
    let leaveToday = 0;

    for (const a of todayAttendanceList) {
      if (a.status === 'Present') presentToday++;
      else if (a.status === 'Absent') absentToday++;
      else if (a.status === 'Late') lateToday++;
      else if (a.status === 'Leave') leaveToday++;
    }

    const totalMarkedToday = todayAttendanceList.length;
    const attendancePercentage = totalMarkedToday > 0
      ? Math.round(((presentToday + lateToday) / totalMarkedToday) * 100)
      : 0;

    // Recent Admissions (last 5)
    const recentAdmissions = allStudents
      .sort((a, b) => new Date(b.createdAt || b.admissionDate || 0) - new Date(a.createdAt || a.admissionDate || 0))
      .slice(0, 5)
      .map(s => ({
        studentId: s.studentId,
        fullName: s.fullName,
        fatherName: s.fatherName,
        className: s.className,
        section: s.section,
        admissionDate: s.admissionDate,
        photoUrl: s.photoUrl,
        status: s.status
      }));

    // Recent Payment Transactions (extract all payment receipts from fee vouchers)
    const recentPayments = [];
    for (const fee of allFees) {
      if (fee.payments && fee.payments.length > 0) {
        for (const p of fee.payments) {
          recentPayments.push({
            receiptNo: p.receiptNo,
            studentName: fee.studentName,
            studentId: fee.studentId,
            className: fee.className,
            amount: p.amount,
            method: p.paymentMethod,
            paymentDate: p.paymentDate,
            month: fee.month,
            receivedBy: p.receivedBy
          });
        }
      }
    }

    recentPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Class distribution
    const classCountMap = {};
    for (const s of allStudents) {
      classCountMap[s.className] = (classCountMap[s.className] || 0) + 1;
    }

    res.status(200).json({
      success: true,
      role: 'admin',
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendance: {
          present: presentToday,
          absent: absentToday,
          late: lateToday,
          leave: leaveToday,
          totalMarked: totalMarkedToday,
          rate: attendancePercentage
        },
        financial: {
          totalCollected: feeStats.totalCollected,
          totalPending: feeStats.totalPending,
          paidCount: feeStats.paidCount,
          partialCount: feeStats.partialCount,
          pendingCount: feeStats.pendingCount,
          overdueCount: feeStats.overdueCount
        }
      },
      recentAdmissions,
      recentPayments: recentPayments.slice(0, 5),
      classDistribution: classCountMap
    });
  } catch (err) {
    next(err);
  }
};

