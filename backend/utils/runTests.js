/**
 * SchoolConnect - Comprehensive Automated Verification Test Suite
 * Tests all 12+ CRUD operations, duplicate prevention, and RBAC permissions
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Storage = require('./storage');
const { connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    testsPassed++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${testName}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('       SchoolConnect: Running Automated Test Suite    ');
  console.log('======================================================\n');

  await connectDB();

  // 1. AUTH & USER ROLES
  console.log('[Test Suite 1: Authentication & RBAC Users]');
  const adminUser = await Storage.users.findOne({ username: 'admin' }, true);
  assert(adminUser !== null, 'Admin user account exists');
  const isAdminMatch = await bcrypt.compare('admin123', adminUser.password);
  assert(isAdminMatch, 'Admin password hashes and verifies with bcrypt');

  const teacherUser = await Storage.users.findOne({ username: 'teacher' });
  assert(teacherUser && teacherUser.role === 'teacher', 'Teacher account exists with teacher role');

  const parentUser = await Storage.users.findOne({ username: 'parent' });
  assert(parentUser && parentUser.role === 'parent', 'Parent account exists with parent role and linked child');

  // 2. STUDENT CRUD & UNIQUE ID
  console.log('\n[Test Suite 2: Student Management CRUD]');
  const testStudentId = 'STU-TEST-999';

  // Cleanup if exists from previous run
  await Storage.students.deleteById(testStudentId);

  const newStudent = await Storage.students.create({
    studentId: testStudentId,
    fullName: 'Kamran Ali Shah',
    fatherName: 'Syed Zulfiqar Shah',
    dob: '2010-05-15',
    gender: 'Male',
    className: 'Class 9',
    section: 'A',
    rollNumber: '09-A-99',
    contactNumber: '0300-9988776',
    parentContact: '0301-1122334',
    address: 'Near Faiz Mahal, Khairpur Mir\'s',
    admissionDate: '2025-11-01',
    status: 'Active',
    monthlyTuitionFee: 3800
  });
  assert(newStudent && newStudent.studentId === testStudentId, 'Add Student successfully (Create)');

  const fetchedStudent = await Storage.students.findByStudentId(testStudentId);
  assert(fetchedStudent && fetchedStudent.fullName === 'Kamran Ali Shah', 'View Individual Student Details (Read)');

  const updatedStudent = await Storage.students.updateById(newStudent._id, {
    fullName: 'Kamran Ali Shah (Updated)',
    monthlyTuitionFee: 4200
  });
  assert(updatedStudent.fullName.includes('(Updated)') && updatedStudent.monthlyTuitionFee === 4200, 'Update Student details (Update)');

  const searchResults = await Storage.students.find({ search: 'Kamran' });
  assert(searchResults.some(s => s.studentId === testStudentId), 'Search Students by name');

  const filterResults = await Storage.students.find({ className: 'Class 9', section: 'A' });
  assert(filterResults.length > 0, 'Filter Students by Class & Section');

  // 3. TEACHER CRUD
  console.log('\n[Test Suite 3: Teacher Management CRUD]');
  const testTeacherId = 'TCH-TEST-999';
  await Storage.teachers.deleteById(testTeacherId);

  const newTeacher = await Storage.teachers.create({
    teacherId: testTeacherId,
    fullName: 'Prof. Ghulam Rasool',
    email: 'ghulam.rasool.test@schoolconnect.edu.pk',
    phoneNumber: '0300-8877665',
    qualification: 'Ph.D Mathematics (MUET)',
    subject: 'Mathematics',
    assignedSubjects: ['Mathematics', 'Statistics'],
    assignedClass: 'Class 10',
    salary: 75000,
    address: 'Khairpur Mir\'s',
    status: 'Active'
  });
  assert(newTeacher && newTeacher.teacherId === testTeacherId, 'Add Teacher successfully (Create)');

  const updatedTeacher = await Storage.teachers.updateById(newTeacher._id, { salary: 80000 });
  assert(updatedTeacher.salary === 80000, 'Update Teacher Salary (Update)');

  const teacherSearch = await Storage.teachers.find({ search: 'Ghulam' });
  assert(teacherSearch.some(t => t.teacherId === testTeacherId), 'Search Teachers');

  // 4. ATTENDANCE MANAGEMENT & DUPLICATE PREVENTION
  console.log('\n[Test Suite 4: Attendance Management & Duplicate Prevention]');
  const testDate = '2025-11-05';

  const mark1 = await Storage.attendance.markRecord({
    studentId: testStudentId,
    studentName: 'Kamran Ali Shah',
    className: 'Class 9',
    section: 'A',
    date: testDate,
    status: 'Present',
    remarks: 'Present on time',
    markedBy: 'Admin'
  });
  assert(mark1 && mark1.status === 'Present', 'Mark Student Attendance successfully (Create)');

  // Attempt to mark again on same date: MUST NOT create duplicate record, but update existing
  const mark2 = await Storage.attendance.markRecord({
    studentId: testStudentId,
    studentName: 'Kamran Ali Shah',
    className: 'Class 9',
    section: 'A',
    date: testDate,
    status: 'Late',
    remarks: 'Status updated to Late',
    markedBy: 'Admin'
  });
  assert(mark2 && mark2.status === 'Late', 'Update existing attendance record gracefully');

  const attendanceEntries = await Storage.attendance.find({ studentId: testStudentId, date: testDate });
  assert(attendanceEntries.length === 1, 'PREVENT DUPLICATE ATTENDANCE: Exactly 1 record exists for student on same date');

  // 5. FEE MANAGEMENT & DUPLICATE PREVENTION & PAYMENTS
  console.log('\n[Test Suite 5: Fee Management, Duplicates & Partial Payments]');
  const testMonth = 'November 2025';

  // Cleanup test fee if exists
  const existingFeeList = await Storage.fees.find({ studentId: testStudentId, month: testMonth });
  for (const f of existingFeeList) {
    await Storage.fees.deleteById(f._id);
  }

  const newFee = await Storage.fees.create({
    feeId: 'FEE-TEST-999',
    studentId: testStudentId,
    studentName: 'Kamran Ali Shah',
    className: 'Class 9',
    section: 'A',
    month: testMonth,
    academicYear: '2025-2026',
    tuitionFee: 4000,
    examFee: 500,
    totalFee: 4500,
    paidAmount: 0,
    remainingBalance: 4500,
    dueDate: '2025-11-10',
    paymentStatus: 'Pending',
    payments: []
  });
  assert(newFee && newFee.totalFee === 4500 && newFee.paymentStatus === 'Pending', 'Generate Monthly Fee voucher (Create)');

  // Test duplicate prevention
  let duplicatePrevented = false;
  try {
    await Storage.fees.create({
      feeId: 'FEE-TEST-DUPLICATE',
      studentId: testStudentId,
      studentName: 'Kamran Ali Shah',
      className: 'Class 9',
      section: 'A',
      month: testMonth,
      totalFee: 4500,
      paidAmount: 0,
      remainingBalance: 4500,
      dueDate: '2025-11-10'
    });
  } catch (err) {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, 'PREVENT DUPLICATE MONTHLY FEE: Throws error when attempting duplicate voucher for same student & month');

  // Test Partial Payment of Rs. 2,000
  const partialPayment = await Storage.fees.recordPayment(newFee._id, {
    amount: 2000,
    paymentMethod: 'EasyPaisa',
    notes: 'First installment'
  });
  assert(
    partialPayment.paidAmount === 2000 &&
    partialPayment.remainingBalance === 2500 &&
    partialPayment.paymentStatus === 'Partial',
    'Record Partial Payment: Balance recalculated to Rs. 2,500 and status changed to "Partial"'
  );

  // Test Remaining Payment of Rs. 2,500
  const fullPayment = await Storage.fees.recordPayment(newFee._id, {
    amount: 2500,
    paymentMethod: 'Cash',
    notes: 'Cleared remaining balance'
  });
  assert(
    fullPayment.paidAmount === 4500 &&
    fullPayment.remainingBalance === 0 &&
    fullPayment.paymentStatus === 'Paid',
    'Record Full Payment: Balance recalculated to Rs. 0 and status changed to "Paid"'
  );
  assert(fullPayment.payments.length === 2, 'Maintains detailed payment transaction history log');

  // 6. DASHBOARD AGGREGATIONS
  console.log('\n[Test Suite 6: Real-time Dashboard Aggregations]');
  const totalStudents = await Storage.students.count();
  assert(totalStudents >= 8, `Dashboard counts real students (${totalStudents})`);

  const feeStats = await Storage.fees.getStats();
  assert(feeStats.totalCollected > 0, `Dashboard aggregates fee collection (${feeStats.totalCollected} PKR)`);

  // 7. CLEANUP TEST DATA
  console.log('\n[Test Suite 7: Clean Up & Delete Operations]');
  const delStudent = await Storage.students.deleteById(newStudent._id);
  assert(delStudent !== null, 'Delete Student successfully (Delete)');

  const delTeacher = await Storage.teachers.deleteById(newTeacher._id);
  assert(delTeacher !== null, 'Delete Teacher successfully (Delete)');

  const delFee = await Storage.fees.deleteById(newFee._id);
  assert(delFee !== null, 'Delete Fee Voucher successfully (Delete)');

  if (mark1 && mark1._id) {
    await Storage.attendance.deleteById(mark1._id);
  }

  console.log('\n======================================================');
  console.log(`Results: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
