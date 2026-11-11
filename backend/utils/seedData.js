const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, getMongoStatus } = require('../config/db');

// Ensure dotenv is loaded (supports backend/.env or root repository)
const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const Storage = require('./storage');

const seedDatabase = async () => {
  console.log('\n--- Seeding SchoolConnect Database with Realistic Pakistani School Data ---');

  // Attempt Mongo connection first
  await connectDB();

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedTeacherPassword = await bcrypt.hash('teacher123', 10);
  const hashedStudentPassword = await bcrypt.hash('student123', 10);
  const hashedParentPassword = await bcrypt.hash('parent123', 10);

  // 1. 5 CLASSES
  const classesData = [
    {
      name: 'Class 6',
      numericGrade: 6,
      sections: ['A', 'B'],
      classTeacherName: 'Sir Tariq Mehmood',
      monthlyTuitionFee: 2800,
      roomNumber: 'Room 101',
      capacity: 35,
      subjects: ['English', 'Mathematics', 'General Science', 'Sindhi', 'Urdu', 'Islamiat', 'Social Studies'],
      academicYear: '2025-2026'
    },
    {
      name: 'Class 7',
      numericGrade: 7,
      sections: ['A', 'B'],
      classTeacherName: 'Madam Farzana Shah',
      monthlyTuitionFee: 3000,
      roomNumber: 'Room 102',
      capacity: 35,
      subjects: ['English', 'Mathematics', 'General Science', 'Sindhi', 'Urdu', 'Islamiat', 'Computer Science'],
      academicYear: '2025-2026'
    },
    {
      name: 'Class 8',
      numericGrade: 8,
      sections: ['A', 'B'],
      classTeacherName: 'Sir Naveed Qureshi',
      monthlyTuitionFee: 3200,
      roomNumber: 'Room 201',
      capacity: 40,
      subjects: ['English', 'Mathematics', 'General Science', 'Sindhi', 'Urdu', 'Islamiat', 'Computer Science'],
      academicYear: '2025-2026'
    },
    {
      name: 'Class 9',
      numericGrade: 9,
      sections: ['A', 'B'],
      classTeacherName: 'Sir Abdul Qadir Soomro',
      monthlyTuitionFee: 3600,
      roomNumber: 'Room 202',
      capacity: 40,
      subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Sindhi Salees', 'Islamiat'],
      academicYear: '2025-2026'
    },
    {
      name: 'Class 10',
      numericGrade: 10,
      sections: ['A', 'B'],
      classTeacherName: 'Madam Rashida Memon',
      monthlyTuitionFee: 4000,
      roomNumber: 'Room 301',
      capacity: 40,
      subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Sindhi', 'Urdu'],
      academicYear: '2025-2026'
    }
  ];

  // 2. 10 TEACHERS
  const teachersData = [
    {
      teacherId: 'TCH-2025-001',
      fullName: 'Sir Tariq Mehmood',
      email: 'tariq.mehmood@schoolconnect.edu.pk',
      phoneNumber: '0300-3456781',
      qualification: 'M.Sc Mathematics (MUET Jamshoro)',
      subject: 'Mathematics',
      assignedSubjects: ['Mathematics', 'General Science'],
      assignedClass: 'Class 6',
      assignedClasses: ['Class 6', 'Class 9'],
      joiningDate: '2021-08-15',
      salary: 55000,
      address: 'Near Clock Tower, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-1234567-1',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-002',
      fullName: 'Madam Farzana Shah',
      email: 'teacher@schoolconnect.edu.pk', // Primary Demo Teacher
      phoneNumber: '0312-9876543',
      qualification: 'M.Phil English Literature (SALU Khairpur)',
      subject: 'English',
      assignedSubjects: ['English', 'Urdu'],
      assignedClass: 'Class 7',
      assignedClasses: ['Class 7', 'Class 8'],
      joiningDate: '2022-03-01',
      salary: 52000,
      address: 'Civil Lines, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-7654321-2',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-003',
      fullName: 'Sir Naveed Qureshi',
      email: 'naveed.qureshi@schoolconnect.edu.pk',
      phoneNumber: '0333-7123456',
      qualification: 'M.Sc Computer Science (SZABIST Sukkur)',
      subject: 'Computer Science',
      assignedSubjects: ['Computer Science', 'General Science'],
      assignedClass: 'Class 8',
      assignedClasses: ['Class 8', 'Class 9'],
      joiningDate: '2023-01-10',
      salary: 48000,
      address: 'Station Road, Sukkur, Sindh',
      status: 'Active',
      cnic: '45504-9876543-1',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-004',
      fullName: 'Sir Abdul Qadir Soomro',
      email: 'abdul.qadir@schoolconnect.edu.pk',
      phoneNumber: '0301-4455667',
      qualification: 'M.Sc Physics (University of Sindh)',
      subject: 'Physics',
      assignedSubjects: ['Physics', 'Mathematics'],
      assignedClass: 'Class 9',
      assignedClasses: ['Class 9', 'Class 10'],
      joiningDate: '2020-09-01',
      salary: 60000,
      address: 'Lalbagh Road, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-3456789-3',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-005',
      fullName: 'Madam Rashida Memon',
      email: 'rashida.memon@schoolconnect.edu.pk',
      phoneNumber: '0345-8899112',
      qualification: 'M.Sc Chemistry (Quaid-e-Azam University)',
      subject: 'Chemistry',
      assignedSubjects: ['Chemistry', 'Biology'],
      assignedClass: 'Class 10',
      assignedClasses: ['Class 9', 'Class 10'],
      joiningDate: '2019-11-15',
      salary: 62000,
      address: 'Mall Road, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-5544332-4',
      photoUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-006',
      fullName: 'Sir Zulfiqar Ali Bhutto',
      email: 'zulfiqar.bhutto@schoolconnect.edu.pk',
      phoneNumber: '0305-1122334',
      qualification: 'M.A Pakistan Studies & History (SALU)',
      subject: 'Pakistan Studies',
      assignedSubjects: ['Pakistan Studies', 'Social Studies'],
      assignedClass: 'Class 8',
      assignedClasses: ['Class 6', 'Class 8', 'Class 10'],
      joiningDate: '2022-08-01',
      salary: 47000,
      address: 'Kot Diji, Khairpur District',
      status: 'Active',
      cnic: '45203-2233445-5',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-007',
      fullName: 'Madam Sajida Parveen',
      email: 'sajida.parveen@schoolconnect.edu.pk',
      phoneNumber: '0314-5566778',
      qualification: 'M.A Sindhi Literature (University of Sindh)',
      subject: 'Sindhi',
      assignedSubjects: ['Sindhi', 'Sindhi Salees'],
      assignedClass: 'Class 6',
      assignedClasses: ['Class 6', 'Class 7', 'Class 9'],
      joiningDate: '2023-04-01',
      salary: 44000,
      address: 'Gari Pull, Khairpur Mir\'s',
      status: 'Active',
      cnic: '45203-9988776-6',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-008',
      fullName: 'Sir Qasim Ali Shah',
      email: 'qasim.shah@schoolconnect.edu.pk',
      phoneNumber: '0322-7788990',
      qualification: 'M.A Islamic Studies (Jamia Karachi)',
      subject: 'Islamiat',
      assignedSubjects: ['Islamiat', 'Ethics'],
      assignedClass: 'Class 7',
      assignedClasses: ['Class 6', 'Class 7', 'Class 8'],
      joiningDate: '2021-02-15',
      salary: 46000,
      address: 'Luqman Road, Khairpur Mir\'s',
      status: 'Active',
      cnic: '45203-4455667-7',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-009',
      fullName: 'Madam Huma Gul',
      email: 'huma.gul@schoolconnect.edu.pk',
      phoneNumber: '0331-8899001',
      qualification: 'M.Sc Biology (SALU Khairpur)',
      subject: 'Biology',
      assignedSubjects: ['Biology', 'General Science'],
      assignedClass: 'Class 9',
      assignedClasses: ['Class 9', 'Class 10'],
      joiningDate: '2023-09-01',
      salary: 45000,
      address: 'Kumb Road, Kot Diji',
      status: 'Active',
      cnic: '45203-6677889-8',
      photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-010',
      fullName: 'Sir Asif Ali Zardari',
      email: 'asif.ali@schoolconnect.edu.pk',
      phoneNumber: '0308-9900112',
      qualification: 'B.Ed & B.Sc Sports Sciences',
      subject: 'Physical Education',
      assignedSubjects: ['Physical Education', 'General Science'],
      assignedClass: 'Class 10',
      assignedClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
      joiningDate: '2022-11-01',
      salary: 42000,
      address: 'Stadium Road, Khairpur Mir\'s',
      status: 'Active',
      cnic: '45203-1133557-9',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // 3. 50 STUDENTS (10 per class, classes 6 to 10)
  const studentNames = [
    { name: 'Muhammad Ali Soomro', father: 'Ghulam Mustafa Soomro', gender: 'Male' },
    { name: 'Fatima Zahra Memon', father: 'Dr. Abdul Razzaq Memon', gender: 'Female' },
    { name: 'Hamza Khan Baloch', father: 'Sardar Nadir Ali Khan', gender: 'Male' },
    { name: 'Ayesha Noor Abbasi', father: 'Engr. Noor Muhammad Abbasi', gender: 'Female' },
    { name: 'Bilal Ahmed Shaikh', father: 'Mushtaq Ahmed Shaikh', gender: 'Male' },
    { name: 'Zainab Bibi Phulpoto', father: 'Haji Ghulam Shabbir', gender: 'Female' },
    { name: 'Usman Tariq Rajput', father: 'Tariq Mehmood Rajput', gender: 'Male' },
    { name: 'Dua Khan Chandio', father: 'Ali Nawaz Chandio', gender: 'Female' },
    { name: 'Saad Ur Rehman', father: 'Atta Ur Rehman Qureshi', gender: 'Male' },
    { name: 'Sanaullah Mallah', father: 'Khadim Hussain Mallah', gender: 'Male' },
    { name: 'Hira Batool Syed', father: 'Syed Zafar Abbas Shah', gender: 'Female' },
    { name: 'Ahmed Raza Pirzada', father: 'Ghulam Rasool Pirzada', gender: 'Male' },
    { name: 'Alishba Maryam', father: 'Muhammad Hashim Brohi', gender: 'Female' },
    { name: 'Shahmeer Ali Larik', father: 'Altaf Hussain Larik', gender: 'Male' },
    { name: 'Khadija Tul Kubra', father: 'Maulana Hafizullah', gender: 'Female' },
    { name: 'Zeeshan Hyder Wassan', father: 'Manzoor Hussain Wassan', gender: 'Male' },
    { name: 'Maryam Nawaz Jamali', father: 'Mir Hazar Khan Jamali', gender: 'Female' },
    { name: 'Faizan Mustafa Shar', father: 'Ghulam Mustafa Shar', gender: 'Male' },
    { name: 'Bakhtawar Rind', father: 'Sardar Sheraz Rind', gender: 'Female' },
    { name: 'Daniyal Khan Solangi', father: 'Javed Iqbal Solangi', gender: 'Male' },
    { name: 'Mehak Fatima Ujjan', father: 'Dr. Imtiaz Ali Ujjan', gender: 'Female' },
    { name: 'Rehan Farooq Mangrio', father: 'Farooq Ahmed Mangrio', gender: 'Male' },
    { name: 'Kinza Tariq Gopang', father: 'Tariq Hussain Gopang', gender: 'Female' },
    { name: 'Asadullah Lashari', father: 'Nisar Ahmed Lashari', gender: 'Male' },
    { name: 'Saba Gulzar Channa', father: 'Gulzar Ahmed Channa', gender: 'Female' },
    { name: 'Haris Munir Junejo', father: 'Munir Ahmed Junejo', gender: 'Male' },
    { name: 'Anum Zahoor Dayo', father: 'Zahoor Ahmed Dayo', gender: 'Female' },
    { name: 'Farhan Ali Abro', father: 'Ashfaque Ali Abro', gender: 'Male' },
    { name: 'Jannat Ul Firdous', father: 'Qari Abdul Ghafoor', gender: 'Female' },
    { name: 'Waleed Raza Khuhro', father: 'Shahid Raza Khuhro', gender: 'Male' },
    { name: 'Nida Parveen Kubar', father: 'Akbar Ali Kubar', gender: 'Female' },
    { name: 'Adeel Murtaza Buriro', father: 'Ghulam Murtaza Buriro', gender: 'Male' },
    { name: 'Rabiya Basri Kazi', father: 'Kazi Inayatullah', gender: 'Female' },
    { name: 'Shoaib Akhtar Maitlo', father: 'Mushtaq Ali Maitlo', gender: 'Male' },
    { name: 'Bushra Kainat Mirani', father: 'Liaquat Ali Mirani', gender: 'Female' },
    { name: 'Muzammil Hussain Panhwar', father: 'Hussain Bux Panhwar', gender: 'Male' },
    { name: 'Mahnoor Shahzad Kalhoro', father: 'Shahzad Ali Kalhoro', gender: 'Female' },
    { name: 'Yasir Arafat Unar', father: 'Aijaz Ali Unar', gender: 'Male' },
    { name: 'Iqra Bano Tagar', father: 'Amanullah Tagar', gender: 'Female' },
    { name: 'Kashif Ali Jagirani', father: 'Niaz Hussain Jagirani', gender: 'Male' },
    { name: 'Syeda Fatima Gillani', father: 'Syed Mehdi Raza Gillani', gender: 'Female' },
    { name: 'Zohaib Hassan Narejo', father: 'Hassan Ali Narejo', gender: 'Male' },
    { name: 'Samina Nazir Jogi', father: 'Nazir Ahmed Jogi', gender: 'Female' },
    { name: 'Babar Azam Talpur', father: 'Mir Babar Talpur', gender: 'Male' },
    { name: 'Shaista Parveen Bozdar', father: 'Rahim Bux Bozdar', gender: 'Female' },
    { name: 'Noman Ali Dahraj', father: 'Lal Bux Dahraj', gender: 'Male' },
    { name: 'Wareesha Siddiqui', father: 'Dr. Masood Siddiqui', gender: 'Female' },
    { name: 'Sheraz Ahmed Hingoro', father: 'Ahmed Khan Hingoro', gender: 'Male' },
    { name: 'Hafsa Manzoor Tunio', father: 'Manzoor Ali Tunio', gender: 'Female' },
    { name: 'Ammar Yasir Mahar', father: 'Ghulam Qadir Mahar', gender: 'Male' }
  ];

  const classesList = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  const studentsData = [];

  for (let i = 0; i < 50; i++) {
    const idNum = String(i + 1).padStart(3, '0');
    const studentId = `STU-2025-${idNum}`;
    const item = studentNames[i];
    const classIdx = Math.floor(i / 10);
    const className = classesList[classIdx];
    const section = (i % 2 === 0) ? 'A' : 'B';
    const rollNum = `${String(6 + classIdx).padStart(2, '0')}-${section}-${String((i % 10) + 1).padStart(2, '0')}`;
    const monthlyFee = classIdx === 0 ? 2800 : classIdx === 1 ? 3000 : classIdx === 2 ? 3200 : classIdx === 3 ? 3600 : 4000;

    studentsData.push({
      studentId,
      fullName: item.name,
      fatherName: item.father,
      dob: `201${Math.min(4, Math.floor(i / 10))}-0${(i % 9) + 1}-15`,
      gender: item.gender,
      className,
      section,
      rollNumber: rollNum,
      contactNumber: `030${(i % 9) + 1}-${String(2000000 + i * 3421).substring(0, 7)}`,
      parentContact: `033${(i % 9) + 1}-${String(8000000 + i * 2154).substring(0, 7)}`,
      address: `House #${i + 12}, Mohallah Faizabad, Khairpur Mir's, Sindh`,
      admissionDate: `2024-04-0${(i % 8) + 1}`,
      photoUrl: item.gender === 'Female'
        ? `https://images.unsplash.com/photo-${1517841905240 + (i % 5)}?w=150&auto=format&fit=crop&q=80`
        : `https://images.unsplash.com/photo-${1539571696357 + (i % 5)}?w=150&auto=format&fit=crop&q=80`,
      status: 'Active',
      bFormOrCnic: `45203-${String(1000000 + i * 291).substring(0, 7)}-${item.gender === 'Male' ? '1' : '2'}`,
      monthlyTuitionFee: monthlyFee,
      emergencyContact: `033${(i % 9) + 1}-${String(8000000 + i * 2154).substring(0, 7)}`
    });
  }

  // 4. USERS: 2 Admins, 10 Teachers, Student Accounts, 1 Parent
  const usersData = [
    // 2 Admins
    {
      name: 'System Administrator',
      email: 'admin@schoolconnect.edu.pk',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'admin',
      phone: '0300-1234567',
      status: 'active'
    },
    {
      name: 'Principal Dr. Inamullah Baloch',
      email: 'principal@schoolconnect.edu.pk',
      username: 'principal',
      password: hashedAdminPassword,
      role: 'admin',
      phone: '0300-7654321',
      status: 'active'
    },
    // Primary Demo Teacher
    {
      name: 'Madam Farzana Shah',
      email: 'teacher@schoolconnect.edu.pk',
      username: 'teacher',
      password: hashedTeacherPassword,
      role: 'teacher',
      phone: '0312-9876543',
      teacherRef: 'TCH-2025-002',
      status: 'active'
    },
    // Additional Teachers
    {
      name: 'Sir Tariq Mehmood',
      email: 'tariq.mehmood@schoolconnect.edu.pk',
      username: 'tariq',
      password: hashedTeacherPassword,
      role: 'teacher',
      phone: '0300-3456781',
      teacherRef: 'TCH-2025-001',
      status: 'active'
    },
    {
      name: 'Sir Abdul Qadir Soomro',
      email: 'abdul.qadir@schoolconnect.edu.pk',
      username: 'abdulqadir',
      password: hashedTeacherPassword,
      role: 'teacher',
      phone: '0301-4455667',
      teacherRef: 'TCH-2025-004',
      status: 'active'
    },
    // Student Accounts (Primary Demo Student STU-2025-001 and second demo student STU-2025-002)
    {
      name: 'Muhammad Ali Soomro',
      email: 'student@schoolconnect.edu.pk',
      username: 'student',
      password: hashedStudentPassword,
      role: 'student',
      phone: '0302-3344551',
      studentId: 'STU-2025-001',
      studentIds: ['STU-2025-001'],
      status: 'active'
    },
    {
      name: 'Fatima Zahra Memon',
      email: 'fatima@schoolconnect.edu.pk',
      username: 'fatima',
      password: hashedStudentPassword,
      role: 'student',
      phone: '0315-7766554',
      studentId: 'STU-2025-002',
      studentIds: ['STU-2025-002'],
      status: 'active'
    },
    // Demo Parent
    {
      name: 'Ghulam Mustafa Soomro',
      email: 'parent@schoolconnect.edu.pk',
      username: 'parent',
      password: hashedParentPassword,
      role: 'parent',
      phone: '0300-9871122',
      studentIds: ['STU-2025-001'],
      status: 'active'
    }
  ];

  // 5. 30 DAYS OF REALISTIC ATTENDANCE RECORDS
  const attendanceData = [];
  const statusOptions = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Leave'];

  // Generate for past 30 days
  const now = new Date();
  const daysToGenerate = 30;

  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dateStr = d.toISOString().split('T')[0];

    // Seed attendance for all 50 students across these days
    for (let sIdx = 0; sIdx < studentsData.length; sIdx++) {
      const stu = studentsData[sIdx];
      // Deterministic variation so each run is idempotent
      const pseudoRandomIndex = (sIdx * 7 + dayOffset * 13) % statusOptions.length;
      const status = (sIdx === 0 && dayOffset === 0) ? 'Present' : statusOptions[pseudoRandomIndex];
      const remarks = status === 'Late' ? 'Arrived 15 minutes late' : (status === 'Leave' ? 'Approved leave slip' : (status === 'Absent' ? 'Uninformed absence' : ''));

      attendanceData.push({
        student: stu.studentId,
        studentId: stu.studentId,
        studentName: stu.fullName,
        className: stu.className,
        section: stu.section,
        date: dateStr,
        status,
        remarks,
        markedBy: 'Sir Tariq Mehmood'
      });
    }
  }

  // 6. FEES WITH ALL STATUSES (Paid, Partial, Pending, Overdue)
  const feesData = [];
  const months = ['November 2025', 'October 2025', 'September 2025'];
  let feeCounter = 1;

  for (let sIdx = 0; sIdx < studentsData.length; sIdx++) {
    const stu = studentsData[sIdx];
    const tFee = stu.monthlyTuitionFee;

    // Distribute statuses across students
    const statusType = (sIdx % 4 === 0) ? 'Paid' : (sIdx % 4 === 1) ? 'Partial' : (sIdx % 4 === 2) ? 'Pending' : 'Overdue';
    const month = (statusType === 'Overdue') ? 'October 2025' : 'November 2025';
    const dueDate = (statusType === 'Overdue') ? '2025-10-10' : '2025-11-10';

    let paidAmount = 0;
    let remainingBalance = tFee;
    let paymentDate = null;
    const payments = [];

    if (statusType === 'Paid') {
      paidAmount = tFee;
      remainingBalance = 0;
      paymentDate = '2025-11-04';
      payments.push({
        paymentId: `PAY-${String(feeCounter).padStart(4, '0')}`,
        amount: tFee,
        paymentDate: '2025-11-04',
        paymentMethod: sIdx % 2 === 0 ? 'JazzCash' : 'Cash',
        receiptNo: `REC-${String(100000 + feeCounter)}`,
        receivedBy: 'Admin',
        notes: 'Full payment received'
      });
    } else if (statusType === 'Partial') {
      paidAmount = Math.round(tFee * 0.5);
      remainingBalance = tFee - paidAmount;
      paymentDate = '2025-11-05';
      payments.push({
        paymentId: `PAY-${String(feeCounter).padStart(4, '0')}`,
        amount: paidAmount,
        paymentDate: '2025-11-05',
        paymentMethod: 'EasyPaisa',
        receiptNo: `REC-${String(100000 + feeCounter)}`,
        receivedBy: 'Admin',
        notes: `Partial payment of Rs. ${paidAmount.toLocaleString()} received`
      });
    }

    const feeId = `FEE-2025-${String(feeCounter).padStart(4, '0')}`;
    feeCounter++;

    feesData.push({
      feeId,
      student: stu.studentId,
      studentId: stu.studentId,
      studentName: stu.fullName,
      className: stu.className,
      section: stu.section,
      month,
      academicYear: '2025-2026',
      tuitionFee: tFee,
      examFee: sIdx % 5 === 0 ? 500 : 0,
      otherCharges: sIdx % 6 === 0 ? 200 : 0,
      discount: sIdx % 7 === 0 ? 300 : 0,
      totalFee: tFee + (sIdx % 5 === 0 ? 500 : 0) + (sIdx % 6 === 0 ? 200 : 0) - (sIdx % 7 === 0 ? 300 : 0),
      paidAmount,
      remainingBalance,
      dueDate,
      paymentDate,
      paymentStatus: statusType,
      payments
    });
  }

  // 7. REALISTIC ACTIVITIES / AUDIT LOGS
  const activitiesData = [
    {
      title: 'Fee Payment Received',
      description: 'Received Rs. 4,100 from Muhammad Ali Soomro (STU-2025-001) for November 2025 via JazzCash.',
      type: 'fee',
      performedBy: 'System Administrator',
      role: 'admin',
      metadata: { studentId: 'STU-2025-001', amount: 4100 },
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      title: 'Daily Attendance Marked',
      description: 'Marked daily attendance for Class 9-A (25 students evaluated).',
      type: 'attendance',
      performedBy: 'Sir Abdul Qadir Soomro',
      role: 'teacher',
      metadata: { className: 'Class 9', section: 'A' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      title: 'New Student Admission',
      description: 'Enrolled student Fatima Zahra Memon (STU-2025-002) in Class 8-A.',
      type: 'admission',
      performedBy: 'System Administrator',
      role: 'admin',
      metadata: { studentId: 'STU-2025-002', className: 'Class 8' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    },
    {
      title: 'Bulk Fee Vouchers Generated',
      description: 'Generated 50 monthly tuition fee vouchers for billing cycle November 2025.',
      type: 'fee',
      performedBy: 'System Administrator',
      role: 'admin',
      metadata: { month: 'November 2025', count: 50 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      title: 'Teacher Assignment Updated',
      description: 'Assigned Sir Naveed Qureshi to Class 8 Computer Science laboratory classes.',
      type: 'system',
      performedBy: 'Principal Dr. Inamullah Baloch',
      role: 'admin',
      metadata: { teacherId: 'TCH-2025-003' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      title: 'Student Profile Updated',
      description: 'Updated emergency contact information for Hamza Khan Baloch (STU-2025-003).',
      type: 'system',
      performedBy: 'System Administrator',
      role: 'admin',
      metadata: { studentId: 'STU-2025-003' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    }
  ];

  // Save to persistent storage / MongoDB (supports standalone backend/ or root repository)
  const DATA_DIR = fs.existsSync(path.join(__dirname, '../../data'))
    ? path.join(__dirname, '../../data')
    : path.join(__dirname, '../data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Write Classes
  console.log(`- Seeding ${classesData.length} Classes...`);
  fs.writeFileSync(path.join(DATA_DIR, 'classes.json'), JSON.stringify(classesData, null, 2));

  // 2. Write Teachers
  console.log(`- Seeding ${teachersData.length} Teachers...`);
  fs.writeFileSync(path.join(DATA_DIR, 'teachers.json'), JSON.stringify(teachersData, null, 2));

  // 3. Write Students
  console.log(`- Seeding ${studentsData.length} Students...`);
  fs.writeFileSync(path.join(DATA_DIR, 'students.json'), JSON.stringify(studentsData, null, 2));

  // 4. Write Users
  console.log(`- Seeding ${usersData.length} User Accounts (Admin, Teacher, Student, Parent)...`);
  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(usersData, null, 2));

  // 5. Write Attendance
  console.log(`- Seeding ${attendanceData.length} Attendance records across 30 days...`);
  fs.writeFileSync(path.join(DATA_DIR, 'attendance.json'), JSON.stringify(attendanceData, null, 2));

  // 6. Write Fees
  console.log(`- Seeding ${feesData.length} Fee records (Paid, Partial, Pending, Overdue)...`);
  fs.writeFileSync(path.join(DATA_DIR, 'fees.json'), JSON.stringify(feesData, null, 2));

  // 7. Write Activities
  console.log(`- Seeding ${activitiesData.length} Activities / Audit logs...`);
  fs.writeFileSync(path.join(DATA_DIR, 'activities.json'), JSON.stringify(activitiesData, null, 2));

  // If MongoDB is connected, also populate MongoDB collections!
  if (getMongoStatus()) {
    console.log('Synchronizing seed data with live MongoDB Atlas/Server...');
    const Class = require('../models/Class');
    const Teacher = require('../models/Teacher');
    const Student = require('../models/Student');
    const User = require('../models/User');
    const Attendance = require('../models/Attendance');
    const Fee = require('../models/Fee');
    const Activity = require('../models/Activity');

    try {
      await Class.deleteMany({});
      const insertedClasses = await Class.insertMany(classesData);

      await Teacher.deleteMany({});
      const insertedTeachers = await Teacher.insertMany(teachersData);
      const teacherMap = {};
      insertedTeachers.forEach(t => { teacherMap[t.teacherId] = t._id; });

      await Student.deleteMany({});
      const insertedStudents = await Student.insertMany(studentsData);
      const studentMap = {};
      insertedStudents.forEach(s => { studentMap[s.studentId] = s._id; });

      // Link User accounts with actual Teacher and Student ObjectIds
      const preparedUsers = usersData.map(u => {
        const copy = { ...u };
        if (copy.teacherRef && teacherMap[copy.teacherRef]) {
          copy.teacherRef = teacherMap[copy.teacherRef];
        }
        if (copy.studentId && studentMap[copy.studentId]) {
          copy.studentRef = studentMap[copy.studentId];
        }
        if (copy.studentIds && Array.isArray(copy.studentIds)) {
          copy.studentIds = copy.studentIds.map(sid => studentMap[sid] || sid).filter(id => mongoose.Types.ObjectId.isValid(id));
        }
        return copy;
      });

      await User.deleteMany({});
      await User.insertMany(preparedUsers);

      // Link Attendance with student ObjectId
      const preparedAttendance = attendanceData.map(a => ({
        ...a,
        student: studentMap[a.studentId] || undefined
      }));
      await Attendance.deleteMany({});
      await Attendance.insertMany(preparedAttendance);

      // Link Fees with student ObjectId
      const preparedFees = feesData.map(f => ({
        ...f,
        student: studentMap[f.studentId] || undefined
      }));
      await Fee.deleteMany({});
      await Fee.insertMany(preparedFees);

      await Activity.deleteMany({});
      await Activity.insertMany(activitiesData);

      const [cCount, tCount, sCount, uCount, aCount, fCount, actCount] = await Promise.all([
        Class.countDocuments(),
        Teacher.countDocuments(),
        Student.countDocuments(),
        User.countDocuments(),
        Attendance.countDocuments(),
        Fee.countDocuments(),
        Activity.countDocuments()
      ]);

      console.log('✔ Live MongoDB Atlas Collections Populated:');
      console.log(`  - Classes:     ${cCount}`);
      console.log(`  - Teachers:    ${tCount}`);
      console.log(`  - Students:    ${sCount}`);
      console.log(`  - Users:       ${uCount}`);
      console.log(`  - Attendance:  ${aCount}`);
      console.log(`  - Fees:        ${fCount}`);
      console.log(`  - Activities:  ${actCount}`);
    } catch (dbErr) {
      console.warn('Note on Mongo sync:', dbErr.message);
    }
  }

  console.log('\n✔ SchoolConnect database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials for Testing & Presentation:');
  console.log('1. Admin:   admin@schoolconnect.edu.pk   / admin123');
  console.log('2. Teacher: teacher@schoolconnect.edu.pk / teacher123');
  console.log('3. Student: student@schoolconnect.edu.pk / student123');
  console.log('4. Parent:  parent@schoolconnect.edu.pk  / parent123');
  console.log('----------------------------------------------------\n');
};

// Run directly if invoked from command line
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
