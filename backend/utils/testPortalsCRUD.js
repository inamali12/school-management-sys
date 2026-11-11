/**
 * SchoolConnect - Portal Workflows & Live MongoDB CRUD Persistence Test
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const { connectDB } = require('../config/db');
const app = require('../app');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('       SchoolConnect: Testing Portals & MongoDB CRUD   ');
  console.log('======================================================\n');

  await connectDB();
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  const results = [];

  try {
    // 1. Admin Login
    const adminLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'admin@schoolconnect.edu.pk',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;

    // 2. Admin CRUD on Students: CREATE
    const newStudentData = {
      studentId: 'STU-LIVE-001',
      fullName: 'Live Atlas Test Student',
      fatherName: 'Mustafa Test',
      dob: '2011-03-10',
      gender: 'Male',
      className: 'Class 9',
      section: 'A',
      rollNumber: '09-A-99',
      contactNumber: '0300-1122334',
      parentContact: '0300-9988776',
      address: 'Khairpur Mirs',
      monthlyTuitionFee: 3500
    };
    const createRes = await makeRequest(server, {
      path: '/api/students',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, newStudentData);

    const mongoStudentCreated = await Student.findOne({ studentId: 'STU-LIVE-001' });
    results.push({
      test: 'Admin Create Student & Persist in MongoDB Atlas',
      success: createRes.statusCode === 201 && mongoStudentCreated !== null,
      details: `HTTP ${createRes.statusCode}, Atlas ID: ${mongoStudentCreated?._id}`
    });

    // Admin CRUD: UPDATE
    const updateRes = await makeRequest(server, {
      path: `/api/students/${mongoStudentCreated._id}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, { fullName: 'Live Atlas Test Student (Updated)', monthlyTuitionFee: 4000 });

    const mongoStudentUpdated = await Student.findOne({ studentId: 'STU-LIVE-001' });
    results.push({
      test: 'Admin Update Student & Persist in MongoDB Atlas',
      success: updateRes.statusCode === 200 && mongoStudentUpdated.fullName.includes('(Updated)'),
      details: `HTTP ${updateRes.statusCode}, Updated Name: ${mongoStudentUpdated?.fullName}`
    });

    // Admin CRUD: DELETE
    const deleteRes = await makeRequest(server, {
      path: `/api/students/${mongoStudentCreated._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const mongoStudentDeleted = await Student.findOne({ studentId: 'STU-LIVE-001' });
    results.push({
      test: 'Admin Delete Student & Persist in MongoDB Atlas',
      success: deleteRes.statusCode === 200 && mongoStudentDeleted === null,
      details: `HTTP ${deleteRes.statusCode}, Document removed from Atlas`
    });

    // 3. Teacher Portal Workflows
    const teacherLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'teacher@schoolconnect.edu.pk',
      password: 'teacher123'
    });
    const teacherToken = teacherLogin.data.token;

    // Teacher Marks Attendance for STU-2025-001
    const today = new Date().toISOString().split('T')[0];
    const markAttRes = await makeRequest(server, {
      path: '/api/attendance',
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` }
    }, {
      studentId: 'STU-2025-001',
      date: today,
      status: 'Present',
      remarks: 'Verified by Teacher in class'
    });

    const mongoAtt = await Attendance.findOne({ studentId: 'STU-2025-001', date: today });
    results.push({
      test: 'Teacher Mark Daily Attendance & Persist in MongoDB Atlas',
      success: (markAttRes.statusCode === 200 || markAttRes.statusCode === 201) && mongoAtt !== null && mongoAtt.status === 'Present',
      details: `HTTP ${markAttRes.statusCode}, Persisted in Atlas on ${today}`
    });

    // Teacher tries to create a fee voucher (Forbidden)
    const teacherFeeAttempt = await makeRequest(server, {
      path: '/api/fees',
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` }
    }, {
      studentId: 'STU-2025-001',
      month: 'December 2025',
      totalFee: 3000
    });
    results.push({
      test: 'Teacher Blocked from Fee Module (RBAC)',
      success: teacherFeeAttempt.statusCode === 403,
      details: `HTTP ${teacherFeeAttempt.statusCode} Forbidden as expected`
    });

    // 4. Student Portal Workflows & Strict Isolation
    const studentLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'student@schoolconnect.edu.pk',
      password: 'student123'
    });
    const studentToken = studentLogin.data.token;

    // Student tries to access another student's details STU-2025-002
    const targetStudent = await Student.findOne({ studentId: 'STU-2025-002' });
    const studentForbiddenAttempt = await makeRequest(server, {
      path: `/api/students/${targetStudent._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    results.push({
      test: 'Student Blocked from Viewing Other Student Records',
      success: studentForbiddenAttempt.statusCode === 403,
      details: `HTTP ${studentForbiddenAttempt.statusCode} (Access Denied: You are only allowed to view your own student record)`
    });

    // Student tries to mark attendance (Forbidden)
    const studentMarkAttempt = await makeRequest(server, {
      path: '/api/attendance',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      studentId: 'STU-2025-001',
      date: today,
      status: 'Present'
    });
    results.push({
      test: 'Student Blocked from Marking Attendance (RBAC)',
      success: studentMarkAttempt.statusCode === 403,
      details: `HTTP ${studentMarkAttempt.statusCode} Forbidden`
    });

  } finally {
    server.close();
  }

  console.log('\n--- Portal & Live Atlas CRUD Test Results ---');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.success ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✘ FAIL\x1b[0m';
    console.log(`${symbol} ${r.test} -> ${r.details}`);
    if (r.success) passCount++;
  }

  console.log('\n======================================================');
  console.log(`Summary: ${passCount} / ${results.length} Portal Tests PASSED`);
  console.log('======================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Portal Test Execution Error:', err);
  process.exit(1);
});
