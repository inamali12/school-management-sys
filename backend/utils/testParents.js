const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    let payload = null;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers = options.headers || {};
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' SchoolConnect - Parent Management & Linking Tests');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Admin Login
    const adminRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin@schoolconnect.edu.pk', password: 'admin123' });

    assert('Admin login successful (HTTP 200)', adminRes.status === 200 && adminRes.data?.token, JSON.stringify(adminRes.data));
    const adminToken = adminRes.data?.token;

    // 2. Parent Login
    const parentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'parent@schoolconnect.edu.pk', password: 'parent123' });

    assert('Parent login successful (HTTP 200)', parentRes.status === 200 && parentRes.data?.token, JSON.stringify(parentRes.data));
    const parentToken = parentRes.data?.token;
    const parentUserId = parentRes.data?.user?.id || parentRes.data?.user?._id;

    // 3. Teacher Login (for RBAC testing)
    const teacherRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'teacher@schoolconnect.edu.pk', password: 'teacher123' });

    assert('Teacher login successful (HTTP 200)', teacherRes.status === 200 && teacherRes.data?.token, JSON.stringify(teacherRes.data));
    const teacherToken = teacherRes.data?.token;

    // 4. Parent Dashboard Verification (STU-2025-001 Muhammad Ali Soomro)
    const parentDashRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentToken}`
      }
    });

    assert('Parent dashboard returns 200 OK', parentDashRes.status === 200);
    assert('Parent dashboard role is parent', parentDashRes.data?.role === 'parent');
    assert('Parent has linked children array', Array.isArray(parentDashRes.data?.children) && parentDashRes.data.children.length > 0);

    const firstChild = parentDashRes.data?.children?.[0];
    assert('Linked child is Muhammad Ali Soomro (STU-2025-001)', 
      firstChild && (firstChild.studentId === 'STU-2025-001' || firstChild.fullName.includes('Muhammad Ali Soomro')),
      `Got child: ${firstChild?.fullName} (${firstChild?.studentId})`
    );
    assert('Child has attendance stats calculated', firstChild?.attendanceStats && firstChild.attendanceStats.attendanceRate !== undefined);
    assert('Child has fee records loaded', Array.isArray(firstChild?.feeRecords));

    // 5. Admin Parent Management: GET /api/parents
    const getParentsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/parents',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert('Admin can GET /api/parents (HTTP 200)', getParentsRes.status === 200);
    assert('Response contains summary statistics', 
      getParentsRes.data?.stats && getParentsRes.data.stats.totalParents >= 1 && getParentsRes.data.stats.linkedParents >= 1
    );
    assert('Parent Ghulam Mustafa Soomro found in list with linked child', 
      getParentsRes.data?.data?.some(p => p.email === 'parent@schoolconnect.edu.pk' && p.linkedChildren?.length > 0)
    );

    // 6. Admin Parent Management: GET /api/parents/:id
    const singleParentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/parents/${parentUserId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert('Admin can GET /api/parents/:id (HTTP 200)', singleParentRes.status === 200);
    assert('Parent details include linked children with stats', 
      singleParentRes.data?.data?.linkedChildren?.length > 0 &&
      (singleParentRes.data.data.linkedChildren[0].attendanceRate !== undefined || singleParentRes.data.data.linkedChildren[0].attendanceStats !== undefined)
    );

    // 7. Admin Create New Parent Account
    const testEmail = `testparent_${Date.now()}@example.com`;
    const createParentRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/parents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      name: 'Testing Guardian Parent',
      email: testEmail,
      phone: '0300-5551234',
      password: 'password123',
      address: 'Test House #4, Model Colony, Khairpur'
    });

    assert('Admin can create new parent account (HTTP 201)', createParentRes.status === 201 && createParentRes.data?.data?._id);
    const newParentId = createParentRes.data?.data?._id;

    // 8. Fetch all students to get a student to link
    const studentsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const students = studentsRes.data?.data || [];
    // Pick a student other than the first child (e.g. 2nd student)
    const testStudent = students.find(s => s.studentId !== 'STU-2025-001') || students[0];
    assert('Found a student for testing links', Boolean(testStudent));

    if (newParentId && testStudent) {
      // 9. Admin Link Student to New Parent
      const linkRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/parents/${newParentId}/link-student`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, { studentId: testStudent._id });

      assert('Admin can link student to parent (HTTP 200)', linkRes.status === 200 && linkRes.data?.success);

      // 10. Duplicate Link Prevention
      const dupLinkRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/parents/${newParentId}/link-student`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, { studentId: testStudent._id });

      assert('Duplicate link is prevented with error (HTTP 400)', dupLinkRes.status === 400);

      // 11. Student Details returns linked parent
      const checkStudentRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/students/${testStudent._id}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      assert('Student details reflect linked parent', 
        checkStudentRes.status === 200 && 
        checkStudentRes.data?.data?.linkedParent?.email === testEmail
      );

      // 12. Admin Unlink Student from Parent
      const unlinkRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/parents/${newParentId}/unlink-student/${testStudent._id}`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      assert('Admin can unlink student from parent (HTTP 200)', unlinkRes.status === 200 && unlinkRes.data?.success);

      // 13. Student-initiated Link Parent API
      const stuLinkRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/students/${testStudent._id}/link-parent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, { parentId: newParentId });

      assert('Student API link-parent works (HTTP 200)', stuLinkRes.status === 200 && stuLinkRes.data?.success);

      // 14. Student-initiated Unlink Parent API
      const stuUnlinkRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/students/${testStudent._id}/unlink-parent`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      assert('Student API unlink-parent works (HTTP 200)', stuUnlinkRes.status === 200 && stuUnlinkRes.data?.success);

      // 15. Update Parent Profile
      const updateParentRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/parents/${newParentId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, {
        name: 'Updated Guardian Name',
        phone: '0300-9998877'
      });

      assert('Admin can update parent profile (HTTP 200)', updateParentRes.status === 200 && updateParentRes.data?.data?.name === 'Updated Guardian Name');

      // 16. Delete Temporary Parent (Safe deletion: Student remains enrolled)
      const deleteParentRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/parents/${newParentId}`,
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      assert('Admin can delete parent account (HTTP 200)', deleteParentRes.status === 200);

      // 17. Verify Student Still Exists After Parent Deleted
      const verifyStudentStillExists = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/students/${testStudent._id}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      assert('Student record is safely preserved after parent deletion (HTTP 200)', verifyStudentStillExists.status === 200);
    }

    // 18. RBAC Security: Teacher cannot access /api/parents (HTTP 403 Forbidden)
    const teacherForbiddenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/parents',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    assert('RBAC: Teacher blocked from parent management (HTTP 403)', teacherForbiddenRes.status === 403);

    // 19. RBAC Security: Parent cannot access admin /api/parents (HTTP 403 Forbidden)
    const parentForbiddenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/parents',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentToken}`
      }
    });

    assert('RBAC: Parent blocked from admin parent management (HTTP 403)', parentForbiddenRes.status === 403);

    // 20. Parent can access their own children at GET /api/parent/my-children
    const myChildrenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/parent/my-children',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentToken}`
      }
    });

    assert('Parent can access GET /api/parent/my-children (HTTP 200)', myChildrenRes.status === 200 && Array.isArray(myChildrenRes.data?.data));

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
