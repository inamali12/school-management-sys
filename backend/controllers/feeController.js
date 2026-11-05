const Storage = require('../utils/storage');

// @desc    Get all fee records (with search & filters)
// @route   GET /api/fees
// @access  Private (Admin, Parent)
exports.getFees = async (req, res, next) => {
  try {
    const { month, className, paymentStatus, studentId, search } = req.query;
    const user = req.user;

    // Parent restriction: only see their children's fees
    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(id => String(id).toUpperCase());
      let fees = await Storage.fees.find({ month, className, paymentStatus, search });
      fees = fees.filter(f => allowedIds.includes(String(f.studentId).toUpperCase()));
      return res.status(200).json({
        success: true,
        count: fees.length,
        data: fees
      });
    }

    // Teachers are blocked from financial module
    if (user.role === 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Teachers cannot access financial and fee management.'
      });
    }

    const fees = await Storage.fees.find({
      month,
      className,
      paymentStatus,
      studentId,
      search
    });

    res.status(200).json({
      success: true,
      count: fees.length,
      data: fees
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single fee voucher by ID
// @route   GET /api/fees/:id
// @access  Private
exports.getFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const fee = await Storage.fees.findById(id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: `Fee record "${id}" not found`
      });
    }

    if (user.role === 'parent') {
      const allowedIds = (user.studentIds || []).map(sid => String(sid).toUpperCase());
      if (!allowedIds.includes(String(fee.studentId).toUpperCase())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this fee voucher.'
        });
      }
    }

    // Attach student contact & address for voucher printing
    const student = await Storage.students.findByStudentId(fee.studentId);

    res.status(200).json({
      success: true,
      data: {
        ...fee,
        studentDetails: student || {}
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate next unique Fee Voucher ID
// @route   GET /api/fees/generate/next-id
// @access  Private (Admin)
exports.generateFeeId = async (req, res, next) => {
  try {
    const nextId = await Storage.fees.getNextFeeId();
    res.status(200).json({
      success: true,
      feeId: nextId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate single fee voucher
// @route   POST /api/fees
// @access  Private (Admin only)
exports.createFee = async (req, res, next) => {
  try {
    const {
      studentId,
      month,
      tuitionFee,
      examFee,
      otherCharges,
      discount,
      dueDate,
      academicYear
    } = req.body;

    if (!studentId || !month || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Student ID, Fee Month, and Due Date'
      });
    }

    const student = await Storage.students.findByStudentId(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${studentId}" not found.`
      });
    }

    // Check duplicate fee for same student and month
    const existing = await Storage.fees.find({
      studentId: student.studentId,
      month
    });
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fee voucher for student ${student.fullName} (${student.studentId}) for "${month}" already exists!`
      });
    }

    const tFee = Number(tuitionFee !== undefined ? tuitionFee : student.monthlyTuitionFee) || 0;
    const eFee = Number(examFee) || 0;
    const oCharges = Number(otherCharges) || 0;
    const disc = Number(discount) || 0;
    const total = Math.max(0, (tFee + eFee + oCharges) - disc);

    const feeId = await Storage.fees.getNextFeeId();

    const newFee = await Storage.fees.create({
      feeId,
      student: student._id,
      studentId: student.studentId,
      studentName: student.fullName,
      className: student.className,
      section: student.section,
      month,
      academicYear: academicYear || '2025-2026',
      tuitionFee: tFee,
      examFee: eFee,
      otherCharges: oCharges,
      discount: disc,
      totalFee: total,
      paidAmount: 0,
      remainingBalance: total,
      dueDate,
      paymentDate: null,
      paymentStatus: 'Pending',
      payments: []
    });

    res.status(201).json({
      success: true,
      message: `Fee voucher ${feeId} generated successfully for ${student.fullName}!`,
      data: newFee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate monthly fee in bulk for an entire class
// @route   POST /api/fees/bulk-generate
// @access  Private (Admin only)
exports.generateBulkFees = async (req, res, next) => {
  try {
    const { className, section, month, dueDate, examFee, otherCharges, discount } = req.body;

    if (!className || !month || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Class Name, Billing Month, and Due Date'
      });
    }

    // Get students of this class
    let students = await Storage.students.find({ className, status: 'Active' });
    if (section && section !== 'all') {
      students = students.filter(s => s.section.toUpperCase() === section.toUpperCase());
    }

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active students found in ${className} ${section ? section : ''}`
      });
    }

    const created = [];
    const skipped = [];

    for (const student of students) {
      // Check duplicate
      const existing = await Storage.fees.find({ studentId: student.studentId, month });
      if (existing.length > 0) {
        skipped.push({ studentId: student.studentId, name: student.fullName, reason: 'Already generated' });
        continue;
      }

      const feeId = await Storage.fees.getNextFeeId();
      const tFee = Number(student.monthlyTuitionFee) || 3000;
      const eFee = Number(examFee) || 0;
      const oCharges = Number(otherCharges) || 0;
      const disc = Number(discount) || 0;
      const total = Math.max(0, (tFee + eFee + oCharges) - disc);

      const voucher = await Storage.fees.create({
        feeId,
        student: student._id,
        studentId: student.studentId,
        studentName: student.fullName,
        className: student.className,
        section: student.section,
        month,
        academicYear: '2025-2026',
        tuitionFee: tFee,
        examFee: eFee,
        otherCharges: oCharges,
        discount: disc,
        totalFee: total,
        paidAmount: 0,
        remainingBalance: total,
        dueDate,
        paymentDate: null,
        paymentStatus: 'Pending',
        payments: []
      });

      created.push(voucher);
    }

    res.status(201).json({
      success: true,
      message: `Bulk fee generation completed: ${created.length} vouchers created, ${skipped.length} existing skipped.`,
      createdCount: created.length,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record partial or full payment
// @route   POST /api/fees/:id/pay
// @access  Private (Admin only)
exports.recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment amount greater than 0'
      });
    }

    const updated = await Storage.fees.recordPayment(id, {
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      receivedBy: req.user.name || 'Admin'
    });

    res.status(200).json({
      success: true,
      message: `Payment of Rs. ${Number(amount).toLocaleString()} recorded successfully! Voucher status is now ${updated.paymentStatus}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update fee voucher info
// @route   PUT /api/fees/:id
// @access  Private (Admin only)
exports.updateFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.fees.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Fee voucher "${id}" not found`
      });
    }

    const updated = await Storage.fees.updateById(existing._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Fee record updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete incorrect fee voucher
// @route   DELETE /api/fees/:id
// @access  Private (Admin only)
exports.deleteFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Storage.fees.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Fee voucher "${id}" not found`
      });
    }

    await Storage.fees.deleteById(existing._id);

    res.status(200).json({
      success: true,
      message: `Fee record "${existing.feeId}" deleted successfully!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get fee financial statistics
// @route   GET /api/fees/stats/summary
// @access  Private (Admin only)
exports.getFeeStats = async (req, res, next) => {
  try {
    const stats = await Storage.fees.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

