/**
 * SchoolConnect - Production API & RBAC Endpoint Verification Script
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const { connectDB, getMongoStatus } = require('../config/db');
const app = require('../app');

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
  console.log('       SchoolConnect: Testing Production REST APIs     ');
  console.log('======================================================\n');

  await connectDB();
  console.log('Database Status: Connected to MongoDB Atlas:', getMongoStatus());

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`Ephemeral Test Server listening on port ${port}...\n`);

  const results = [];

  try {
    // 1. GET /api/health
    const resHealth = await makeRequest(server, { path: '/api/health', method: 'GET' });
    results.push({
      endpoint: 'GET /api/health',
      expectedStatus: 200,
      actualStatus: resHealth.statusCode,
      success: resHealth.statusCode === 200 && resHealth.data.status === 'online',
      details: `App: ${resHealth.data.app}, Status: ${resHealth.data.status}`
    });

    // 2. POST /api/auth/login (Admin)
    const resLoginAdmin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'admin@schoolconnect.edu.pk',
      password: 'admin123'
    });
    const adminToken = resLoginAdmin.data && resLoginAdmin.data.token;
    results.push({
      endpoint: 'POST /api/auth/login (Admin)',
      expectedStatus: 200,
      actualStatus: resLoginAdmin.statusCode,
      success: resLoginAdmin.statusCode === 200 && !!adminToken,
      details: `User: ${resLoginAdmin.data.user?.name}, Role: ${resLoginAdmin.data.user?.role}`
    });

    // Login Teacher
    const resLoginTeacher = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'teacher@schoolconnect.edu.pk',
      password: 'teacher123'
    });
    const teacherToken = resLoginTeacher.data && resLoginTeacher.data.token;
    results.push({
      endpoint: 'POST /api/auth/login (Teacher)',
      expectedStatus: 200,
      actualStatus: resLoginTeacher.statusCode,
      success: resLoginTeacher.statusCode === 200 && !!teacherToken,
      details: `User: ${resLoginTeacher.data.user?.name}, Role: ${resLoginTeacher.data.user?.role}`
    });

    // Login Student
    const resLoginStudent = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      username: 'student@schoolconnect.edu.pk',
      password: 'student123'
    });
    const studentToken = resLoginStudent.data && resLoginStudent.data.token;
    results.push({
      endpoint: 'POST /api/auth/login (Student)',
      expectedStatus: 200,
      actualStatus: resLoginStudent.statusCode,
      success: resLoginStudent.statusCode === 200 && !!studentToken,
      details: `User: ${resLoginStudent.data.user?.name}, Role: ${resLoginStudent.data.user?.role}, StudentID: ${resLoginStudent.data.user?.studentId}`
    });

    // 3. GET /api/auth/me (Admin, Teacher, Student)
    const resMeAdmin = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/auth/me (Admin)',
      expectedStatus: 200,
      actualStatus: resMeAdmin.statusCode,
      success: resMeAdmin.statusCode === 200 && resMeAdmin.data.user?.role === 'admin',
      details: `Verified Admin: ${resMeAdmin.data.user?.name}`
    });

    const resMeStudent = await makeRequest(server, {
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    results.push({
      endpoint: 'GET /api/auth/me (Student)',
      expectedStatus: 200,
      actualStatus: resMeStudent.statusCode,
      success: resMeStudent.statusCode === 200 && resMeStudent.data.user?.role === 'student',
      details: `Verified Student: ${resMeStudent.data.user?.name}, Linked Profile: ${resMeStudent.data.user?.studentProfile?.fullName || 'STU-2025-001'}`
    });

    // 4. GET /api/dashboard/stats (Admin)
    const resDashAdmin = await makeRequest(server, {
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/dashboard/stats (Admin)',
      expectedStatus: 200,
      actualStatus: resDashAdmin.statusCode,
      success: resDashAdmin.statusCode === 200 && resDashAdmin.data.role === 'admin',
      details: `Students: ${resDashAdmin.data.stats?.totalStudents}, Teachers: ${resDashAdmin.data.stats?.totalTeachers}, Classes: ${resDashAdmin.data.stats?.totalClasses}, Fee Collected: Rs. ${resDashAdmin.data.stats?.financial?.totalCollected}`
    });

    // GET /api/dashboard/stats (Student)
    const resDashStudent = await makeRequest(server, {
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    results.push({
      endpoint: 'GET /api/dashboard/stats (Student)',
      expectedStatus: 200,
      actualStatus: resDashStudent.statusCode,
      success: resDashStudent.statusCode === 200 && resDashStudent.data.role === 'student',
      details: `Attendance Rate: ${resDashStudent.data.attendanceStats?.attendanceRate}%, Today Status: ${resDashStudent.data.todayStatus}, Fee Balance: Rs. ${resDashStudent.data.feeSummary?.remainingBalance}`
    });

    // 5. GET /api/students (Admin vs Student)
    const resStudentsAdmin = await makeRequest(server, {
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/students (Admin)',
      expectedStatus: 200,
      actualStatus: resStudentsAdmin.statusCode,
      success: resStudentsAdmin.statusCode === 200 && resStudentsAdmin.data.count >= 50,
      details: `Total Enrolled Students Returned: ${resStudentsAdmin.data.count}`
    });

    const resStudentsStudent = await makeRequest(server, {
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    results.push({
      endpoint: 'GET /api/students (Student Isolation)',
      expectedStatus: 200,
      actualStatus: resStudentsStudent.statusCode,
      success: resStudentsStudent.statusCode === 200 && resStudentsStudent.data.count === 1 && resStudentsStudent.data.data[0].studentId === 'STU-2025-001',
      details: `Student sees ONLY 1 record (their own STU-2025-001)`
    });

    // 6. GET /api/teachers
    const resTeachers = await makeRequest(server, {
      path: '/api/teachers',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/teachers (Admin)',
      expectedStatus: 200,
      actualStatus: resTeachers.statusCode,
      success: resTeachers.statusCode === 200 && resTeachers.data.count >= 10,
      details: `Total Faculty Members Returned: ${resTeachers.data.count}`
    });

    // 7. GET /api/classes
    const resClasses = await makeRequest(server, {
      path: '/api/classes',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/classes',
      expectedStatus: 200,
      actualStatus: resClasses.statusCode,
      success: resClasses.statusCode === 200 && resClasses.data.count >= 5,
      details: `Total Classes Returned: ${resClasses.data.count}`
    });

    // 8. GET /api/attendance (Admin vs Student)
    const resAttAdmin = await makeRequest(server, {
      path: '/api/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/attendance (Admin)',
      expectedStatus: 200,
      actualStatus: resAttAdmin.statusCode,
      success: resAttAdmin.statusCode === 200 && resAttAdmin.data.count > 0,
      details: `Total Attendance Records: ${resAttAdmin.data.count}`
    });

    const resAttStudent = await makeRequest(server, {
      path: '/api/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentAttOnly = resAttStudent.data.data.every(a => a.studentId === 'STU-2025-001');
    results.push({
      endpoint: 'GET /api/attendance (Student Isolation)',
      expectedStatus: 200,
      actualStatus: resAttStudent.statusCode,
      success: resAttStudent.statusCode === 200 && studentAttOnly,
      details: `Student sees ${resAttStudent.data.count} attendance records (strictly filtered to STU-2025-001)`
    });

    // 9. GET /api/fees (Admin vs Student vs Teacher blocked)
    const resFeesAdmin = await makeRequest(server, {
      path: '/api/fees',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    results.push({
      endpoint: 'GET /api/fees (Admin)',
      expectedStatus: 200,
      actualStatus: resFeesAdmin.statusCode,
      success: resFeesAdmin.statusCode === 200 && resFeesAdmin.data.count >= 50,
      details: `Total Fee Records: ${resFeesAdmin.data.count}`
    });

    const resFeesStudent = await makeRequest(server, {
      path: '/api/fees',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentFeesOnly = resFeesStudent.data.data.every(f => f.studentId === 'STU-2025-001');
    results.push({
      endpoint: 'GET /api/fees (Student Isolation)',
      expectedStatus: 200,
      actualStatus: resFeesStudent.statusCode,
      success: resFeesStudent.statusCode === 200 && studentFeesOnly,
      details: `Student sees ${resFeesStudent.data.count} vouchers (strictly filtered to STU-2025-001)`
    });

    const resFeesTeacher = await makeRequest(server, {
      path: '/api/fees',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    results.push({
      endpoint: 'GET /api/fees (Teacher Forbidden)',
      expectedStatus: 403,
      actualStatus: resFeesTeacher.statusCode,
      success: resFeesTeacher.statusCode === 403,
      details: `Teachers blocked from financial records (Message: "${resFeesTeacher.data.message}")`
    });

  } finally {
    server.close();
  }

  console.log('\n--- Production API Test Results ---');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.success ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✘ FAIL\x1b[0m';
    console.log(`${symbol} [HTTP ${r.actualStatus}] ${r.endpoint} -> ${r.details}`);
    if (r.success) passCount++;
  }

  console.log('\n======================================================');
  console.log(`Summary: ${passCount} / ${results.length} API Tests PASSED`);
  console.log('======================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('API Test Execution Error:', err);
  process.exit(1);
});

