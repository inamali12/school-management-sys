const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
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
  const hashedParentPassword = await bcrypt.hash('parent123', 10);

  // 1. CLASSES
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

  // 2. TEACHERS
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
      salary: 52000,
      address: 'Near Clock Tower, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-1234567-1',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      teacherId: 'TCH-2025-002',
      fullName: 'Madam Farzana Shah',
      email: 'teacher@schoolconnect.edu.pk', // Demo teacher login
      phoneNumber: '0312-9876543',
      qualification: 'M.Phil English Literature (SALU Khairpur)',
      subject: 'English',
      assignedSubjects: ['English', 'Urdu'],
      assignedClass: 'Class 7',
      assignedClasses: ['Class 7', 'Class 8'],
      joiningDate: '2022-03-01',
      salary: 48000,
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
      salary: 45000,
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
      salary: 55000,
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
      salary: 58000,
      address: 'Mall Road, Khairpur Mir\'s, Sindh',
      status: 'Active',
      cnic: '45203-5544332-4',
      photoUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // 3. STUDENTS
  const studentsData = [
    {
      studentId: 'STU-2025-001',
      fullName: 'Muhammad Ali Soomro',
      fatherName: 'Ghulam Mustafa Soomro',
      dob: '2010-04-12',
      gender: 'Male',
      className: 'Class 9',
      section: 'A',
      rollNumber: '09-A-01',
      contactNumber: '0302-3344551',
      parentContact: '0300-9871122',
      address: 'House #12, Shahi Bazar, Khairpur Mir\'s',
      admissionDate: '2022-04-05',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-0987654-1',
      monthlyTuitionFee: 3600,
      emergencyContact: '0300-9871122'
    },
    {
      studentId: 'STU-2025-002',
      fullName: 'Fatima Zahra Memon',
      fatherName: 'Dr. Abdul Razzaq Memon',
      dob: '2011-08-20',
      gender: 'Female',
      className: 'Class 8',
      section: 'A',
      rollNumber: '08-A-04',
      contactNumber: '0315-7766554',
      parentContact: '0301-4433221',
      address: 'Doctors Colony, Civil Hospital Road, Khairpur',
      admissionDate: '2023-04-10',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-1122334-2',
      monthlyTuitionFee: 3200,
      emergencyContact: '0301-4433221'
    },
    {
      studentId: 'STU-2025-003',
      fullName: 'Hamza Khan Baloch',
      fatherName: 'Sardar Nadir Ali Khan',
      dob: '2009-12-14',
      gender: 'Male',
      className: 'Class 10',
      section: 'A',
      rollNumber: '10-A-07',
      contactNumber: '0334-1122334',
      parentContact: '0333-8899001',
      address: 'Kot Diji Road, Khairpur District',
      admissionDate: '2021-04-01',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-5566778-1',
      monthlyTuitionFee: 4000,
      emergencyContact: '0333-8899001'
    },
    {
      studentId: 'STU-2025-004',
      fullName: 'Ayesha Noor Abbasi',
      fatherName: 'Engr. Noor Muhammad Abbasi',
      dob: '2012-02-18',
      gender: 'Female',
      className: 'Class 7',
      section: 'A',
      rollNumber: '07-A-02',
      contactNumber: '0321-9988776',
      parentContact: '0321-4455661',
      address: 'Officers Colony, Station Road, Khairpur',
      admissionDate: '2024-04-02',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-3344556-2',
      monthlyTuitionFee: 3000,
      emergencyContact: '0321-4455661'
    },
    {
      studentId: 'STU-2025-005',
      fullName: 'Bilal Ahmed Shaikh',
      fatherName: 'Nisar Ahmed Shaikh',
      dob: '2013-06-25',
      gender: 'Male',
      className: 'Class 6',
      section: 'A',
      rollNumber: '06-A-03',
      contactNumber: '0342-5566778',
      parentContact: '0300-6677889',
      address: 'Grain Market Road, Khairpur Mir\'s',
      admissionDate: '2024-04-05',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-8899001-1',
      monthlyTuitionFee: 2800,
      emergencyContact: '0300-6677889'
    },
    {
      studentId: 'STU-2025-006',
      fullName: 'Zainab Bibi Phulpoto',
      fatherName: 'Bashir Ahmed Phulpoto',
      dob: '2010-11-05',
      gender: 'Female',
      className: 'Class 9',
      section: 'B',
      rollNumber: '09-B-05',
      contactNumber: '0316-2233445',
      parentContact: '0311-5544332',
      address: 'Near Faiz Mahal, Khairpur Mir\'s',
      admissionDate: '2023-04-03',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-7788990-2',
      monthlyTuitionFee: 3600,
      emergencyContact: '0311-5544332'
    },
    {
      studentId: 'STU-2025-007',
      fullName: 'Usman Tariq Rajput',
      fatherName: 'Tariq Mehmood Rajput',
      dob: '2009-09-30',
      gender: 'Male',
      className: 'Class 10',
      section: 'B',
      rollNumber: '10-B-02',
      contactNumber: '0304-8877665',
      parentContact: '0300-3456781',
      address: 'Near Clock Tower, Khairpur Mir\'s',
      admissionDate: '2021-04-06',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-6655443-1',
      monthlyTuitionFee: 4000,
      emergencyContact: '0300-3456781'
    },
    {
      studentId: 'STU-2025-008',
      fullName: 'Dua Khan Chandio',
      fatherName: 'Sikandar Ali Chandio',
      dob: '2012-07-15',
      gender: 'Female',
      className: 'Class 7',
      section: 'B',
      rollNumber: '07-B-01',
      contactNumber: '0331-4433221',
      parentContact: '0332-9988112',
      address: 'Railway Colony, Khairpur Mir\'s',
      admissionDate: '2024-04-04',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
      bFormOrCnic: '45203-4433221-2',
      monthlyTuitionFee: 3000,
      emergencyContact: '0332-9988112'
    }
  ];

  // 4. USERS (Admin, Teacher, Parent)
  const usersData = [
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
      name: 'Madam Farzana Shah',
      email: 'teacher@schoolconnect.edu.pk',
      username: 'teacher',
      password: hashedTeacherPassword,
      role: 'teacher',
      phone: '0312-9876543',
      teacherRef: 'TCH-2025-002',
      status: 'active'
    },
    {
      name: 'Ghulam Mustafa Soomro',
      email: 'parent@schoolconnect.edu.pk', // Linked to student Muhammad Ali (STU-2025-001)
      username: 'parent',
      password: hashedParentPassword,
      role: 'parent',
      phone: '0300-9871122',
      studentIds: ['STU-2025-001'],
      status: 'active'
    }
  ];

  // 5. ATTENDANCE (Today & Yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const attendanceData = [
    // Today's records
    {
      studentId: 'STU-2025-001',
      studentName: 'Muhammad Ali Soomro',
      className: 'Class 9',
      section: 'A',
      date: today,
      status: 'Present',
      remarks: 'On time',
      markedBy: 'Sir Abdul Qadir Soomro'
    },
    {
      studentId: 'STU-2025-002',
      studentName: 'Fatima Zahra Memon',
      className: 'Class 8',
      section: 'A',
      date: today,
      status: 'Present',
      remarks: 'Active participant',
      markedBy: 'Sir Naveed Qureshi'
    },
    {
      studentId: 'STU-2025-003',
      studentName: 'Hamza Khan Baloch',
      className: 'Class 10',
      section: 'A',
      date: today,
      status: 'Late',
      remarks: '15 mins late due to transport',
      markedBy: 'Madam Rashida Memon'
    },
    {
      studentId: 'STU-2025-004',
      studentName: 'Ayesha Noor Abbasi',
      className: 'Class 7',
      section: 'A',
      date: today,
      status: 'Present',
      remarks: '',
      markedBy: 'Madam Farzana Shah'
    },
    {
      studentId: 'STU-2025-005',
      studentName: 'Bilal Ahmed Shaikh',
      className: 'Class 6',
      section: 'A',
      date: today,
      status: 'Absent',
      remarks: 'Uninformed absence',
      markedBy: 'Sir Tariq Mehmood'
    },
    {
      studentId: 'STU-2025-006',
      studentName: 'Zainab Bibi Phulpoto',
      className: 'Class 9',
      section: 'B',
      date: today,
      status: 'Leave',
      remarks: 'Medical leave submitted',
      markedBy: 'Sir Abdul Qadir Soomro'
    },
    {
      studentId: 'STU-2025-007',
      studentName: 'Usman Tariq Rajput',
      className: 'Class 10',
      section: 'B',
      date: today,
      status: 'Present',
      remarks: '',
      markedBy: 'Madam Rashida Memon'
    },
    {
      studentId: 'STU-2025-008',
      studentName: 'Dua Khan Chandio',
      className: 'Class 7',
      section: 'B',
      date: today,
      status: 'Present',
      remarks: '',
      markedBy: 'Madam Farzana Shah'
    },

    // Yesterday's records
    {
      studentId: 'STU-2025-001',
      studentName: 'Muhammad Ali Soomro',
      className: 'Class 9',
      section: 'A',
      date: yesterdayDate,
      status: 'Present',
      remarks: '',
      markedBy: 'Sir Abdul Qadir Soomro'
    },
    {
      studentId: 'STU-2025-002',
      studentName: 'Fatima Zahra Memon',
      className: 'Class 8',
      section: 'A',
      date: yesterdayDate,
      status: 'Present',
      remarks: '',
      markedBy: 'Sir Naveed Qureshi'
    },
    {
      studentId: 'STU-2025-003',
      studentName: 'Hamza Khan Baloch',
      className: 'Class 10',
      section: 'A',
      date: yesterdayDate,
      status: 'Present',
      remarks: '',
      markedBy: 'Madam Rashida Memon'
    },
    {
      studentId: 'STU-2025-004',
      studentName: 'Ayesha Noor Abbasi',
      className: 'Class 7',
      section: 'A',
      date: yesterdayDate,
      status: 'Leave',
      remarks: 'Family emergency',
      markedBy: 'Madam Farzana Shah'
    }
  ];

  // 6. FEES
  const currentMonth = 'November 2025';
  const lastMonth = 'October 2025';

  const feesData = [
    {
      feeId: 'FEE-2025-0001',
      studentId: 'STU-2025-001',
      studentName: 'Muhammad Ali Soomro',
      className: 'Class 9',
      section: 'A',
      month: currentMonth,
      academicYear: '2025-2026',
      tuitionFee: 3600,
      examFee: 500,
      otherCharges: 0,
      discount: 0,
      totalFee: 4100,
      paidAmount: 4100,
      remainingBalance: 0,
      dueDate: '2025-11-10',
      paymentDate: '2025-11-04',
      paymentStatus: 'Paid',
      payments: [
        {
          paymentId: 'PAY-NOV01',
          amount: 4100,
          paymentDate: '2025-11-04',
          paymentMethod: 'JazzCash',
          receiptNo: 'REC-981240',
          receivedBy: 'Admin',
          notes: 'Full tuition & exam fee received'
        }
      ]
    },
    {
      feeId: 'FEE-2025-0002',
      studentId: 'STU-2025-002',
      studentName: 'Fatima Zahra Memon',
      className: 'Class 8',
      section: 'A',
      month: currentMonth,
      academicYear: '2025-2026',
      tuitionFee: 3200,
      examFee: 0,
      otherCharges: 200,
      discount: 200,
      totalFee: 3200,
      paidAmount: 2000,
      remainingBalance: 1200,
      dueDate: '2025-11-10',
      paymentDate: '2025-11-02',
      paymentStatus: 'Partial',
      payments: [
        {
          paymentId: 'PAY-NOV02',
          amount: 2000,
          paymentDate: '2025-11-02',
          paymentMethod: 'Cash',
          receiptNo: 'REC-341901',
          receivedBy: 'Admin',
          notes: 'Partial installment paid, remaining Rs. 1,200 due next week'
        }
      ]
    },
    {
      feeId: 'FEE-2025-0003',
      studentId: 'STU-2025-003',
      studentName: 'Hamza Khan Baloch',
      className: 'Class 10',
      section: 'A',
      month: currentMonth,
      academicYear: '2025-2026',
      tuitionFee: 4000,
      examFee: 600,
      otherCharges: 0,
      discount: 0,
      totalFee: 4600,
      paidAmount: 0,
      remainingBalance: 4600,
      dueDate: '2025-11-10',
      paymentDate: null,
      paymentStatus: 'Pending',
      payments: []
    },
    {
      feeId: 'FEE-2025-0004',
      studentId: 'STU-2025-004',
      studentName: 'Ayesha Noor Abbasi',
      className: 'Class 7',
      section: 'A',
      month: currentMonth,
      academicYear: '2025-2026',
      tuitionFee: 3000,
      examFee: 0,
      otherCharges: 100,
      discount: 0,
      totalFee: 3100,
      paidAmount: 3100,
      remainingBalance: 0,
      dueDate: '2025-11-10',
      paymentDate: '2025-11-01',
      paymentStatus: 'Paid',
      payments: [
        {
          paymentId: 'PAY-NOV04',
          amount: 3100,
          paymentDate: '2025-11-01',
          paymentMethod: 'EasyPaisa',
          receiptNo: 'REC-776102',
          receivedBy: 'Admin',
          notes: 'Online transfer completed'
        }
      ]
    },
    {
      feeId: 'FEE-2025-0005',
      studentId: 'STU-2025-005',
      studentName: 'Bilal Ahmed Shaikh',
      className: 'Class 6',
      section: 'A',
      month: currentMonth,
      academicYear: '2025-2026',
      tuitionFee: 2800,
      examFee: 0,
      otherCharges: 0,
      discount: 300,
      totalFee: 2500,
      paidAmount: 0,
      remainingBalance: 2500,
      dueDate: '2025-11-10',
      paymentDate: null,
      paymentStatus: 'Pending',
      payments: []
    },
    {
      feeId: 'FEE-2025-0006',
      studentId: 'STU-2025-006',
      studentName: 'Zainab Bibi Phulpoto',
      className: 'Class 9',
      section: 'B',
      month: lastMonth,
      academicYear: '2025-2026',
      tuitionFee: 3600,
      examFee: 0,
      otherCharges: 0,
      discount: 0,
      totalFee: 3600,
      paidAmount: 0,
      remainingBalance: 3600,
      dueDate: '2025-10-10',
      paymentDate: null,
      paymentStatus: 'Overdue',
      payments: []
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
  console.log(`- Seeding ${usersData.length} User Accounts (Admin, Teacher, Parent)...`);
  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(usersData, null, 2));

  // 5. Write Attendance
  console.log(`- Seeding ${attendanceData.length} Attendance records...`);
  fs.writeFileSync(path.join(DATA_DIR, 'attendance.json'), JSON.stringify(attendanceData, null, 2));

  // 6. Write Fees
  console.log(`- Seeding ${feesData.length} Fee records (Paid, Partial, Pending, Overdue)...`);
  fs.writeFileSync(path.join(DATA_DIR, 'fees.json'), JSON.stringify(feesData, null, 2));

  // If MongoDB is connected, also populate MongoDB collections!
  if (getMongoStatus()) {
    console.log('Synchronizing seed data with live MongoDB Atlas/Server...');
    const Class = require('../models/Class');
    const Teacher = require('../models/Teacher');
    const Student = require('../models/Student');
    const User = require('../models/User');
    const Attendance = require('../models/Attendance');
    const Fee = require('../models/Fee');

    try {
      await Class.deleteMany({});
      await Class.insertMany(classesData);

      await Teacher.deleteMany({});
      await Teacher.insertMany(teachersData);

      await Student.deleteMany({});
      await Student.insertMany(studentsData);

      await User.deleteMany({});
      for (const u of usersData) {
        await User.create(u);
      }

      await Attendance.deleteMany({});
      await Attendance.insertMany(attendanceData);

      await Fee.deleteMany({});
      await Fee.insertMany(feesData);
      console.log('✔ MongoDB Collections populated successfully!');
    } catch (dbErr) {
      console.warn('Note on Mongo sync:', dbErr.message);
    }
  }

  console.log('\n✔ SchoolConnect database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials for Testing & Presentation:');
  console.log('1. Admin:   admin@schoolconnect.edu.pk   / admin123');
  console.log('2. Teacher: teacher@schoolconnect.edu.pk / teacher123');
  console.log('3. Parent:  parent@schoolconnect.edu.pk  / parent123');
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

