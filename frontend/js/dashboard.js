/**
 * SchoolConnect - Dashboard Controller
 * Fetches real database aggregation metrics and renders role-tailored views
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('dashboard-loading');
  const viewEl = document.getElementById('dashboard-view');

  try {
    const response = await API.dashboard.getStats();
    loadingEl.style.display = 'none';
    viewEl.style.display = 'block';

    if (response.role === 'admin') {
      renderAdminDashboard(response);
    } else if (response.role === 'teacher') {
      renderTeacherDashboard(response);
    } else if (response.role === 'student') {
      renderStudentDashboard(response);
    } else if (response.role === 'parent') {
      renderParentDashboard(response);
    }
  } catch (err) {
    loadingEl.style.display = 'none';
    viewEl.style.display = 'block';
    viewEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" style="color: var(--danger); background: #fee2e2;">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3>Failed to Load Dashboard Data</h3>
        <p>${err.message || 'Please make sure your server and database are active.'}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
});

// ----------------------------------------------------
// 1. ADMIN DASHBOARD
// ----------------------------------------------------
function renderAdminDashboard(data) {
  const { stats, recentAdmissions, recentPayments, classDistribution } = data;
  const view = document.getElementById('dashboard-view');

  const attRate = stats.todayAttendance.rate || 0;

  let html = `
    <!-- Top 4 Primary Metric Cards -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-content">
          <h3>Total Students</h3>
          <div class="stat-number">${stats.totalStudents}</div>
          <div class="stat-subtext"><i class="fa-solid fa-circle-check" style="color: var(--success);"></i> Active Enrolled</div>
        </div>
        <div class="stat-icon primary"><i class="fa-solid fa-user-graduate"></i></div>
      </div>

      <div class="stat-card secondary">
        <div class="stat-content">
          <h3>Total Teachers</h3>
          <div class="stat-number">${stats.totalTeachers}</div>
          <div class="stat-subtext"><i class="fa-solid fa-briefcase" style="color: var(--secondary);"></i> Teaching Faculty</div>
        </div>
        <div class="stat-icon secondary"><i class="fa-solid fa-chalkboard-user"></i></div>
      </div>

      <div class="stat-card info">
        <div class="stat-content">
          <h3>Total Classes</h3>
          <div class="stat-number">${stats.totalClasses}</div>
          <div class="stat-subtext"><i class="fa-solid fa-door-open" style="color: var(--accent);"></i> Grade 1 to 10</div>
        </div>
        <div class="stat-icon info"><i class="fa-solid fa-school"></i></div>
      </div>

      <div class="stat-card success">
        <div class="stat-content">
          <h3>Today Attendance</h3>
          <div class="stat-number">${attRate}%</div>
          <div class="stat-subtext">${stats.todayAttendance.present} of ${stats.todayAttendance.totalMarked || stats.totalStudents} Present</div>
        </div>
        <div class="stat-icon success"><i class="fa-solid fa-clipboard-user"></i></div>
      </div>
    </div>

    <!-- Secondary Financial & Attendance Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-content">
          <h3>Fees Collected</h3>
          <div class="stat-number" style="font-size: 1.5rem; color: var(--success);">${Utils.formatCurrency(stats.financial.totalCollected)}</div>
          <div class="stat-subtext">${stats.financial.paidCount} Vouchers fully paid</div>
        </div>
        <div class="stat-icon success"><i class="fa-solid fa-money-bill-wave"></i></div>
      </div>

      <div class="stat-card danger">
        <div class="stat-content">
          <h3>Pending Fee Dues</h3>
          <div class="stat-number" style="font-size: 1.5rem; color: var(--danger);">${Utils.formatCurrency(stats.financial.totalPending)}</div>
          <div class="stat-subtext">${stats.financial.pendingCount + stats.financial.partialCount + stats.financial.overdueCount} Unsettled vouchers</div>
        </div>
        <div class="stat-icon danger"><i class="fa-solid fa-hand-holding-dollar"></i></div>
      </div>

      <div class="stat-card warning">
        <div class="stat-content">
          <h3>Absent Today</h3>
          <div class="stat-number" style="font-size: 1.5rem; color: #b45309;">${stats.todayAttendance.absent}</div>
          <div class="stat-subtext">${stats.todayAttendance.leave} on approved leave</div>
        </div>
        <div class="stat-icon warning"><i class="fa-solid fa-user-xmark"></i></div>
      </div>

      <div class="stat-card info">
        <div class="stat-content">
          <h3>Late Arrivals</h3>
          <div class="stat-number" style="font-size: 1.5rem; color: var(--accent);">${stats.todayAttendance.late}</div>
          <div class="stat-subtext">Recorded today</div>
        </div>
        <div class="stat-icon info"><i class="fa-solid fa-clock"></i></div>
      </div>
    </div>

    <!-- Quick Action Shortcuts -->
    <div class="card" style="margin-bottom: 2rem;">
      <div class="card-header">
        <div class="card-title-group">
          <h2><i class="fa-solid fa-bolt" style="color: #eab308; margin-right: 0.5rem;"></i> Quick Operations</h2>
          <p>Instant shortcuts to mandatory administrative modules</p>
        </div>
      </div>
      <div class="card-body">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="students.html?action=add" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i> Add New Student
          </a>
          <a href="attendance.html" class="btn btn-secondary">
            <i class="fa-solid fa-calendar-check"></i> Mark Daily Attendance
          </a>
          <a href="fees.html?action=generate" class="btn btn-success">
            <i class="fa-solid fa-file-invoice-dollar"></i> Generate Fee Vouchers
          </a>
          <a href="teachers.html?action=add" class="btn btn-outline">
            <i class="fa-solid fa-chalkboard-user"></i> Register Teacher
          </a>
          <a href="reports.html" class="btn btn-outline">
            <i class="fa-solid fa-chart-line"></i> View Reports Hub
          </a>
        </div>
      </div>
    </div>

    <!-- Analytics Visual Breakdown & Class Enrollment Grid -->
    <div class="dashboard-grid-2">
      <!-- Attendance Today Breakdown -->
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Today's Attendance Ratio</h2>
            <p>Live student turnout breakdown</p>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.88rem; font-weight: 600;">
              <span>Turnout Rate</span>
              <span style="color: var(--primary); font-weight: 700;">${attRate}%</span>
            </div>
            <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; display: flex;">
              <div style="width: ${attRate}%; background: var(--success);" title="Present"></div>
              <div style="width: ${100 - attRate}%; background: var(--danger);" title="Absent/Leave"></div>
            </div>
          </div>

          <div class="dashboard-grid-2" style="margin-bottom: 0; gap: 1rem;">
            <div style="padding: 0.85rem; background: var(--success-bg); border-radius: var(--radius-md); border-left: 3px solid var(--success);">
              <small style="color: #065f46; font-weight: 600;">Present Students</small>
              <h4 style="font-size: 1.4rem; color: #047857; margin-top: 0.2rem;">${stats.todayAttendance.present}</h4>
            </div>
            <div style="padding: 0.85rem; background: var(--danger-bg); border-radius: var(--radius-md); border-left: 3px solid var(--danger);">
              <small style="color: #991b1b; font-weight: 600;">Absent Students</small>
              <h4 style="font-size: 1.4rem; color: #b91c1c; margin-top: 0.2rem;">${stats.todayAttendance.absent}</h4>
            </div>
            <div style="padding: 0.85rem; background: var(--warning-bg); border-radius: var(--radius-md); border-left: 3px solid var(--warning);">
              <small style="color: #92400e; font-weight: 600;">Late Arrivals</small>
              <h4 style="font-size: 1.4rem; color: #b45309; margin-top: 0.2rem;">${stats.todayAttendance.late}</h4>
            </div>
            <div style="padding: 0.85rem; background: #eff6ff; border-radius: var(--radius-md); border-left: 3px solid #3b82f6;">
              <small style="color: #1e40af; font-weight: 600;">On Leave</small>
              <h4 style="font-size: 1.4rem; color: #2563eb; margin-top: 0.2rem;">${stats.todayAttendance.leave}</h4>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Distribution Card -->
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Class-wise Student Enrollment</h2>
            <p>Active student distribution across grades</p>
          </div>
        </div>
        <div class="card-body">
          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            ${Object.keys(classDistribution || {}).map(className => {
              const count = classDistribution[className];
              const pct = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.84rem; font-weight: 600; margin-bottom: 0.25rem;">
                    <span>${className}</span>
                    <span style="color: var(--text-muted);">${count} Students (${pct}%)</span>
                  </div>
                  <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--secondary), var(--primary));"></div>
                  </div>
                </div>
              `;
            }).join('') || '<p style="color: var(--text-muted);">No class data available</p>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Data Tables Grid: Recent Admissions & Recent Payments -->
    <div class="dashboard-grid-2">
      <!-- Recent Admissions Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Recent Admissions</h2>
            <p>Latest registered students</p>
          </div>
          <a href="students.html" class="btn btn-outline btn-sm">View All</a>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Admission Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentAdmissions.length ? recentAdmissions.map(s => `
                <tr>
                  <td>
                    <div class="table-user-cell">
                      <img src="${s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" class="table-avatar" alt="${s.fullName}">
                      <div class="table-user-info">
                        <strong>${s.fullName}</strong>
                        <small>${s.studentId}</small>
                      </div>
                    </div>
                  </td>
                  <td><strong>${s.className}-${s.section}</strong></td>
                  <td>${Utils.formatDate(s.admissionDate)}</td>
                  <td><span class="badge badge-active">${s.status}</span></td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="empty-state">No recent admissions</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Payments Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Recent Fee Payments</h2>
            <p>Latest fee collection transactions</p>
          </div>
          <a href="fees.html" class="btn btn-outline btn-sm">View All</a>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt / Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${recentPayments.length ? recentPayments.map(p => `
                <tr>
                  <td>
                    <div class="table-user-info">
                      <strong style="color: var(--primary); font-size: 0.85rem;">${p.receiptNo}</strong>
                      <small>${p.studentName} (${p.className})</small>
                    </div>
                  </td>
                  <td><strong style="color: var(--success); font-weight: 700;">${Utils.formatCurrency(p.amount)}</strong></td>
                  <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${p.method}</span></td>
                  <td>${Utils.formatDate(p.paymentDate)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="empty-state">No payment transactions yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Recent System Activities / Audit Trail -->
    ${data.recentActivities && data.recentActivities.length ? `
    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <div class="card-title-group">
          <h2><i class="fa-solid fa-clock-rotate-left" style="color: var(--secondary); margin-right: 0.4rem;"></i> Recent System Activities</h2>
          <p>Live audit trail of admissions, attendance marking, and fee transactions</p>
        </div>
      </div>
      <div class="card-body" style="padding: 1rem 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${data.recentActivities.map(act => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: var(--radius-md); border-left: 4px solid ${act.type === 'admission' ? '#3b82f6' : act.type === 'fee' ? '#10b981' : act.type === 'attendance' ? '#f59e0b' : '#6366f1'}; flex-wrap: wrap; gap: 0.5rem;">
              <div style="min-width: 180px; flex: 1 1 auto;">
                <strong style="color: var(--text-main); font-size: 0.9rem;">${act.title}</strong>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0.2rem 0 0;">${act.description}</p>
              </div>
              <div style="text-align: right; font-size: 0.78rem; color: var(--text-light); white-space: nowrap; margin-left: auto;">
                <span class="badge" style="background: #e2e8f0; color: #334155; margin-bottom: 0.25rem;">${act.performedBy || 'System'}</span><br>
                ${Utils.formatDate(act.createdAt)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}
  `;

  view.innerHTML = html;
}

// ----------------------------------------------------
// 2. TEACHER DASHBOARD
// ----------------------------------------------------
function renderTeacherDashboard(data) {
  const { teacherProfile, assignedClasses, totalAssignedStudents, todayAttendance, myStudents } = data;
  const view = document.getElementById('dashboard-view');

  const welcomeHeading = document.getElementById('welcome-heading');
  const welcomeSub = document.getElementById('welcome-subheading');
  if (welcomeHeading) welcomeHeading.innerText = `Teacher Portal • ${teacherProfile ? teacherProfile.fullName : 'Faculty'}`;
  if (welcomeSub) welcomeSub.innerText = `Assigned Classes: ${assignedClasses.join(', ') || 'General'}`;

  let html = `
    <!-- Teacher Metrics Cards -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-content">
          <h3>Assigned Classes</h3>
          <div class="stat-number">${assignedClasses.length}</div>
          <div class="stat-subtext">${assignedClasses.join(', ')}</div>
        </div>
        <div class="stat-icon primary"><i class="fa-solid fa-chalkboard"></i></div>
      </div>

      <div class="stat-card secondary">
        <div class="stat-content">
          <h3>My Students</h3>
          <div class="stat-number">${totalAssignedStudents}</div>
          <div class="stat-subtext">Under your supervision</div>
        </div>
        <div class="stat-icon secondary"><i class="fa-solid fa-users"></i></div>
      </div>

      <div class="stat-card success">
        <div class="stat-content">
          <h3>Today Present</h3>
          <div class="stat-number" style="color: var(--success);">${todayAttendance.present}</div>
          <div class="stat-subtext">${todayAttendance.attendanceRate}% Attendance Rate</div>
        </div>
        <div class="stat-icon success"><i class="fa-solid fa-user-check"></i></div>
      </div>

      <div class="stat-card danger">
        <div class="stat-content">
          <h3>Today Absent</h3>
          <div class="stat-number" style="color: var(--danger);">${todayAttendance.absent}</div>
          <div class="stat-subtext">${todayAttendance.leave} on leave</div>
        </div>
        <div class="stat-icon danger"><i class="fa-solid fa-user-xmark"></i></div>
      </div>
    </div>

    <!-- Quick Action -->
    <div class="card" style="margin-bottom: 2rem;">
      <div class="card-header">
        <div class="card-title-group">
          <h2>Daily Operations</h2>
          <p>Mark or review attendance for your designated classes</p>
        </div>
        <a href="attendance.html" class="btn btn-primary">
          <i class="fa-solid fa-calendar-check"></i> Mark Today's Attendance
        </a>
      </div>
    </div>

    <!-- My Students List -->
    <div class="card">
      <div class="card-header">
        <div class="card-title-group">
          <h2>Students in Your Assigned Classes</h2>
          <p>Review contact information & academic status</p>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Father Name</th>
              <th>Class & Section</th>
              <th>Parent Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${myStudents && myStudents.length ? myStudents.map(s => `
              <tr>
                <td>
                  <div class="table-user-cell">
                    <img src="${s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" class="table-avatar" alt="${s.fullName}">
                    <div class="table-user-info">
                      <strong>${s.fullName}</strong>
                      <small>${s.studentId}</small>
                    </div>
                  </div>
                </td>
                <td>${s.fatherName}</td>
                <td><strong>${s.className}-${s.section}</strong></td>
                <td><i class="fa-solid fa-phone" style="color: var(--secondary); margin-right: 0.35rem;"></i>${s.parentContact}</td>
                <td><span class="badge badge-active">${s.status}</span></td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="empty-state">No students found</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  view.innerHTML = html;
}

// ----------------------------------------------------
// 3. PARENT PORTAL DASHBOARD
// ----------------------------------------------------
function renderParentDashboard(data) {
  const { parentName, children } = data;
  const view = document.getElementById('dashboard-view');

  const welcomeHeading = document.getElementById('welcome-heading');
  const welcomeSub = document.getElementById('welcome-subheading');
  if (welcomeHeading) welcomeHeading.innerText = `Parent Portal • Welcome, ${parentName}`;
  if (welcomeSub) welcomeSub.innerText = `Track your children's attendance, fees, and academic standing`;

  if (!children || children.length === 0) {
    view.innerHTML = `
      <div class="card">
        <div class="card-body empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-child"></i></div>
          <h3>No Children Linked Yet</h3>
          <p>Please contact school administration with your child's Student ID to link their profile to your account.</p>
        </div>
      </div>
    `;
    return;
  }

  let html = `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      ${children.length > 1 ? `
        <div class="child-tabs-bar" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: var(--bg-surface); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-right: 6px;">
            <i class="fa-solid fa-users"></i> Children:
          </span>
          <button type="button" class="btn btn-primary btn-sm child-tab-btn active" onclick="filterParentChild('all', this)">
            All Children (${children.length})
          </button>
          ${children.map(c => `
            <button type="button" class="btn btn-outline btn-sm child-tab-btn" onclick="filterParentChild('${c.studentId}', this)">
              <i class="fa-solid fa-child"></i> ${c.fullName} (${c.className}-${c.section})
            </button>
          `).join('')}
        </div>
      ` : ''}

      ${children.map(child => {
        const attStats = child.attendanceStats || { total: 0, present: 0, absent: 0, attendanceRate: 0 };
        const feeRecords = child.feeRecords || [];

        let totalDues = 0;
        let totalPaid = 0;
        for (const f of feeRecords) {
          totalDues += Number(f.remainingBalance) || 0;
          totalPaid += Number(f.paidAmount) || 0;
        }

        return `
          <div class="card child-card-container" data-child-id="${child.studentId}" style="border: 2px solid #e0f2fe;">
            <div class="card-header" style="background: linear-gradient(90deg, #f0f9ff, #ffffff);">
              <div class="table-user-cell">
                <img src="${child.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" class="table-avatar" style="width: 52px; height: 52px;" alt="${child.fullName}">
                <div class="table-user-info">
                  <h2 style="font-size: 1.3rem; color: var(--primary);">${child.fullName}</h2>
                  <p style="font-size: 0.85rem; color: var(--text-muted);">
                    ID: <strong>${child.studentId}</strong> • Class: <strong>${child.className}-${child.section}</strong> • Roll #: <strong>${child.rollNumber || 'N/A'}</strong>
                  </p>
                </div>
              </div>
              <div>
                <span class="badge ${child.todayStatus === 'Present' ? 'badge-present' : child.todayStatus === 'Absent' ? 'badge-absent' : 'badge-pending'}" style="font-size: 0.85rem; padding: 0.4rem 0.85rem;">
                  Today: ${child.todayStatus}
                </span>
              </div>
            </div>

            <div class="card-body">
              <!-- Child Stats Grid -->
              <div class="stats-grid" style="margin-bottom: 1.5rem;">
                <div class="stat-card success">
                  <div class="stat-content">
                    <h3>Attendance Rate</h3>
                    <div class="stat-number" style="color: var(--success);">${attStats.attendanceRate}%</div>
                    <div class="stat-subtext">${attStats.present} Present / ${attStats.absent} Absent</div>
                  </div>
                  <div class="stat-icon success"><i class="fa-solid fa-calendar-check"></i></div>
                </div>

                <div class="stat-card danger">
                  <div class="stat-content">
                    <h3>Outstanding Fee Dues</h3>
                    <div class="stat-number" style="color: var(--danger); font-size: 1.5rem;">${Utils.formatCurrency(totalDues)}</div>
                    <div class="stat-subtext">${totalDues === 0 ? 'All fees cleared' : 'Payment required'}</div>
                  </div>
                  <div class="stat-icon danger"><i class="fa-solid fa-receipt"></i></div>
                </div>

                <div class="stat-card primary">
                  <div class="stat-content">
                    <h3>Total Fee Paid</h3>
                    <div class="stat-number" style="font-size: 1.5rem;">${Utils.formatCurrency(totalPaid)}</div>
                    <div class="stat-subtext">Tuition & Exam fees</div>
                  </div>
                  <div class="stat-icon primary"><i class="fa-solid fa-wallet"></i></div>
                </div>
              </div>

              <!-- Child Fee History Table -->
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-main);">
                <i class="fa-solid fa-file-invoice-dollar" style="color: var(--secondary); margin-right: 0.35rem;"></i> Monthly Fee Vouchers
              </h4>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Voucher #</th>
                      <th>Month</th>
                      <th>Total Fee</th>
                      <th>Paid Amount</th>
                      <th>Remaining Balance</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${feeRecords.length ? feeRecords.map(f => `
                      <tr>
                        <td><strong>${f.feeId}</strong></td>
                        <td>${f.month}</td>
                        <td>${Utils.formatCurrency(f.totalFee)}</td>
                        <td><strong style="color: var(--success);">${Utils.formatCurrency(f.paidAmount)}</strong></td>
                        <td><strong style="color: var(--danger);">${Utils.formatCurrency(f.remainingBalance)}</strong></td>
                        <td>
                          <span class="badge ${f.paymentStatus === 'Paid' ? 'badge-paid' : f.paymentStatus === 'Partial' ? 'badge-partial' : f.paymentStatus === 'Overdue' ? 'badge-overdue' : 'badge-pending'}">
                            ${f.paymentStatus}
                          </span>
                        </td>
                        <td>${Utils.formatDate(f.dueDate)}</td>
                      </tr>
                    `).join('') : '<tr><td colspan="7" class="empty-state">No fee vouchers recorded</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  view.innerHTML = html;
}

// Child filter handler for Parent Portal with multiple children
window.filterParentChild = function(childId, btn) {
  document.querySelectorAll('.child-tab-btn').forEach(b => {
    b.classList.remove('active', 'btn-primary');
    b.classList.add('btn-outline');
  });
  if (btn) {
    btn.classList.add('active', 'btn-primary');
    btn.classList.remove('btn-outline');
  }

  const cards = document.querySelectorAll('.child-card-container');
  cards.forEach(card => {
    if (childId === 'all' || card.getAttribute('data-child-id') === childId) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
};

// ----------------------------------------------------
// 4. STUDENT PORTAL DASHBOARD
// ----------------------------------------------------
function renderStudentDashboard(data) {
  const { studentProfile, attendanceStats, todayStatus, feeSummary, feeRecords, subjects, recentAttendance } = data;
  const view = document.getElementById('dashboard-view');

  const welcomeHeading = document.getElementById('welcome-heading');
  const welcomeSub = document.getElementById('welcome-subheading');

  const studentName = studentProfile ? studentProfile.fullName : (data.studentName || 'Student');
  const stuId = studentProfile ? studentProfile.studentId : 'N/A';
  const className = studentProfile ? `${studentProfile.className}-${studentProfile.section}` : 'N/A';
  const rollNumber = studentProfile ? (studentProfile.rollNumber || 'N/A') : 'N/A';

  if (welcomeHeading) welcomeHeading.innerText = `Student Portal • Welcome, ${studentName}`;
  if (welcomeSub) welcomeSub.innerText = `Student ID: ${stuId} • Class: ${className} • Roll #: ${rollNumber}`;

  if (!studentProfile) {
    view.innerHTML = `
      <div class="card">
        <div class="card-body empty-state">
          <div class="empty-state-icon" style="color: var(--secondary); background: #f0fdf4;">
            <i class="fa-solid fa-user-graduate"></i>
          </div>
          <h3>Student Profile Not Linked</h3>
          <p>${data.message || 'Please contact school administration with your Student ID to link your academic record.'}</p>
        </div>
      </div>
    `;
    return;
  }

  const attRate = attendanceStats ? (attendanceStats.attendanceRate !== undefined ? attendanceStats.attendanceRate : (attendanceStats.percentage || 0)) : 0;
  const totalDue = feeSummary ? (feeSummary.remainingBalance || 0) : 0;
  const totalPaid = feeSummary ? (feeSummary.paidAmount || 0) : 0;

  const todayStatusClass = todayStatus === 'Present' ? 'badge-present'
    : todayStatus === 'Absent' ? 'badge-absent'
    : todayStatus === 'Late' ? 'badge-late'
    : todayStatus === 'Leave' ? 'badge-leave'
    : 'badge-pending';

  let html = `
    <!-- Top Key Metrics Cards -->
    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-content">
          <h3>Attendance Rate</h3>
          <div class="stat-number" style="color: var(--success);">${attRate}%</div>
          <div class="stat-subtext">${attendanceStats.present || 0} Present • ${attendanceStats.absent || 0} Absent</div>
        </div>
        <div class="stat-icon success"><i class="fa-solid fa-calendar-check"></i></div>
      </div>

      <div class="stat-card primary">
        <div class="stat-content">
          <h3>Today's Attendance</h3>
          <div class="stat-number" style="font-size: 1.45rem;">
            <span class="badge ${todayStatusClass}" style="font-size: 1.05rem; padding: 0.35rem 0.85rem;">
              ${todayStatus}
            </span>
          </div>
          <div class="stat-subtext">Class ${className} Attendance</div>
        </div>
        <div class="stat-icon primary"><i class="fa-solid fa-user-clock"></i></div>
      </div>

      <div class="stat-card ${totalDue > 0 ? 'danger' : 'success'}">
        <div class="stat-content">
          <h3>Fee Balance Due</h3>
          <div class="stat-number" style="font-size: 1.5rem; color: ${totalDue > 0 ? 'var(--danger)' : 'var(--success)'};">
            ${Utils.formatCurrency(totalDue)}
          </div>
          <div class="stat-subtext">${totalDue === 0 ? 'All fee dues cleared' : 'Outstanding dues pending'}</div>
        </div>
        <div class="stat-icon ${totalDue > 0 ? 'danger' : 'success'}"><i class="fa-solid fa-receipt"></i></div>
      </div>

      <div class="stat-card info">
        <div class="stat-content">
          <h3>Total Fees Paid</h3>
          <div class="stat-number" style="font-size: 1.5rem;">${Utils.formatCurrency(totalPaid)}</div>
          <div class="stat-subtext">${feeRecords ? feeRecords.length : 0} Billing Cycles</div>
        </div>
        <div class="stat-icon info"><i class="fa-solid fa-wallet"></i></div>
      </div>
    </div>

    <!-- Main Content Layout: Profile Sidebar & Tables (Fully Responsive) -->
    <div class="dashboard-two-col">
      
      <!-- Left Column: Student Profile Details (30-35% on Desktop, 100% on Mobile) -->
      <div class="dashboard-profile-col">
        <div class="card">
          <div class="student-profile-header">
            <img src="${studentProfile.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" class="student-profile-avatar" alt="${Utils.escapeHtml(studentProfile.fullName)}">
            <h2 class="student-profile-name">${Utils.escapeHtml(studentProfile.fullName)}</h2>
            <span class="badge student-profile-id" style="background: #e0f2fe; color: #0369a1;">${studentProfile.studentId}</span>
          </div>

          <div class="card-body" style="padding: 1rem 1.25rem;">
            <div class="student-details-list">
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-user-tag" style="color: var(--secondary);"></i> Father's Name</span>
                <span class="student-detail-val">${Utils.escapeHtml(studentProfile.fatherName)}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-school" style="color: var(--secondary);"></i> Class & Section</span>
                <span class="student-detail-val">${studentProfile.className} (${studentProfile.section})</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-hashtag" style="color: var(--secondary);"></i> Roll Number</span>
                <span class="student-detail-val">${studentProfile.rollNumber || 'N/A'}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-venus-mars" style="color: var(--secondary);"></i> Gender</span>
                <span class="student-detail-val">${studentProfile.gender}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-cake-candles" style="color: var(--secondary);"></i> Date of Birth</span>
                <span class="student-detail-val">${studentProfile.dob || 'N/A'}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-id-card" style="color: var(--secondary);"></i> B-Form / CNIC</span>
                <span class="student-detail-val" style="font-family: monospace;">${studentProfile.bFormOrCnic || 'N/A'}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-phone" style="color: var(--secondary);"></i> Contact</span>
                <span class="student-detail-val">${studentProfile.contactNumber || 'N/A'}</span>
              </div>
              <div class="student-detail-item">
                <span class="student-detail-label"><i class="fa-solid fa-calendar-days" style="color: var(--secondary);"></i> Admission Date</span>
                <span class="student-detail-val">${Utils.formatDate(studentProfile.admissionDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Enrolled Subjects Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h2><i class="fa-solid fa-book-open" style="color: var(--primary); margin-right: 0.4rem;"></i> Class Subjects</h2>
              <p>Curriculum assigned to ${studentProfile.className}</p>
            </div>
          </div>
          <div class="card-body" style="padding: 1rem 1.25rem;">
            ${subjects && subjects.length ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${subjects.map(sub => `
                  <span class="badge" style="background: #f1f5f9; color: var(--text-main); font-weight: 600; padding: 0.4rem 0.75rem; border: 1px solid #cbd5e1;">
                    <i class="fa-solid fa-bookmark" style="color: var(--secondary); margin-right: 0.35rem;"></i>${sub}
                  </span>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-muted); font-size: 0.88rem;">No subjects defined for this class.</p>'}
          </div>
        </div>
      </div>

      <!-- Right Column: Fee Vouchers & Attendance Log (Remaining width on Desktop, Stacked below on Mobile) -->
      <div class="dashboard-main-col">
        
        <!-- Monthly Fee Vouchers Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h2><i class="fa-solid fa-receipt" style="color: var(--secondary); margin-right: 0.4rem;"></i> My Fee Vouchers & Invoices</h2>
              <p>Review monthly billing, payment status, and dues</p>
            </div>
          </div>

          <!-- Desktop View: Table -->
          <div class="table-responsive desktop-only-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Month</th>
                  <th>Total Fee</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${feeRecords && feeRecords.length ? feeRecords.map(f => `
                  <tr>
                    <td><strong>${f.feeId}</strong></td>
                    <td>${f.month}</td>
                    <td>${Utils.formatCurrency(f.totalFee)}</td>
                    <td><strong style="color: var(--success);">${Utils.formatCurrency(f.paidAmount)}</strong></td>
                    <td><strong style="color: ${f.remainingBalance > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${Utils.formatCurrency(f.remainingBalance)}</strong></td>
                    <td>
                      <span class="badge ${f.paymentStatus === 'Paid' ? 'badge-paid' : f.paymentStatus === 'Partial' ? 'badge-partial' : f.paymentStatus === 'Overdue' ? 'badge-overdue' : 'badge-pending'}">
                        ${f.paymentStatus}
                      </span>
                    </td>
                    <td>${Utils.formatDate(f.dueDate)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" class="empty-state">No fee vouchers available</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Mobile View: Responsive Stacked Fee Cards -->
          <div class="mobile-only-cards" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem;">
            ${feeRecords && feeRecords.length ? feeRecords.map(f => {
              const isPaid = f.paymentStatus === 'Paid';
              const isOverdue = f.paymentStatus === 'Overdue';
              const isPartial = f.paymentStatus === 'Partial';
              const statusClass = isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : isOverdue ? 'badge-overdue' : 'badge-pending';
              const balanceColor = f.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)';

              return `
                <div class="mobile-data-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; background: #ffffff; box-shadow: var(--shadow-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.4rem;">
                    <strong style="color: var(--primary); font-family: monospace; font-size: 0.95rem;">${f.feeId}</strong>
                    <span class="badge ${statusClass}">${f.paymentStatus}</span>
                  </div>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-bottom: 0.65rem;">
                    <i class="fa-solid fa-calendar-check" style="color: var(--secondary); margin-right: 0.35rem;"></i>${f.month}
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: #f8fafc; padding: 0.65rem; border-radius: var(--radius-sm); margin-bottom: 0.6rem; text-align: center;">
                    <div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Total Fee</div>
                      <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main); margin-top: 0.15rem;">${Utils.formatCurrency(f.totalFee)}</div>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Paid</div>
                      <div style="font-weight: 700; font-size: 0.88rem; color: var(--success); margin-top: 0.15rem;">${Utils.formatCurrency(f.paidAmount)}</div>
                    </div>
                    <div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Remaining</div>
                      <div style="font-weight: 700; font-size: 0.88rem; color: ${balanceColor}; margin-top: 0.15rem;">${Utils.formatCurrency(f.remainingBalance)}</div>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
                    <span><i class="fa-regular fa-clock" style="margin-right: 0.3rem;"></i>Due Date</span>
                    <strong style="color: var(--text-main);">${Utils.formatDate(f.dueDate)}</strong>
                  </div>
                </div>
              `;
            }).join('') : '<div class="empty-state">No fee vouchers available</div>'}
          </div>
        </div>

        <!-- Recent Attendance History Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title-group">
              <h2><i class="fa-solid fa-clipboard-check" style="color: var(--success); margin-right: 0.4rem;"></i> Attendance History (Last 15 Days)</h2>
              <p>Recent daily classroom attendance records</p>
            </div>
          </div>

          <!-- Desktop View: Table -->
          <div class="table-responsive desktop-only-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Class / Section</th>
                  <th>Remarks</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                ${recentAttendance && recentAttendance.length ? recentAttendance.map(att => `
                  <tr>
                    <td><strong>${Utils.formatDate(att.date)}</strong></td>
                    <td>
                      <span class="badge ${att.status === 'Present' ? 'badge-present' : att.status === 'Absent' ? 'badge-absent' : att.status === 'Late' ? 'badge-late' : 'badge-leave'}">
                        ${att.status}
                      </span>
                    </td>
                    <td>${att.className}-${att.section}</td>
                    <td>${att.remarks || '<span style="color: var(--text-light);">&mdash;</span>'}</td>
                    <td><small style="color: var(--text-muted);">${att.markedBy || 'Teacher'}</small></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" class="empty-state">No attendance records found</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Mobile View: Responsive Stacked Attendance Cards -->
          <div class="mobile-only-cards" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem;">
            ${recentAttendance && recentAttendance.length ? recentAttendance.map(att => {
              const statusClass = att.status === 'Present' ? 'badge-present'
                : att.status === 'Absent' ? 'badge-absent'
                : att.status === 'Late' ? 'badge-late'
                : 'badge-leave';

              return `
                <div class="mobile-data-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; background: #ffffff; box-shadow: var(--shadow-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.4rem;">
                    <strong style="color: var(--text-main); font-size: 0.92rem;"><i class="fa-regular fa-calendar" style="color: var(--primary); margin-right: 0.35rem;"></i>${Utils.formatDate(att.date)}</strong>
                    <span class="badge ${statusClass}">${att.status}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                    <span>Class & Section:</span>
                    <strong style="color: var(--text-main);">${att.className}-${att.section}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                    <span>Marked By:</span>
                    <span>${att.markedBy || 'Teacher'}</span>
                  </div>
                  ${att.remarks ? `
                    <div style="font-size: 0.82rem; background: #f8fafc; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border-left: 3px solid var(--secondary); margin-top: 0.4rem;">
                      <strong style="color: var(--text-muted); font-size: 0.76rem;">Remarks:</strong> ${Utils.escapeHtml(att.remarks)}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') : '<div class="empty-state">No attendance records found</div>'}
          </div>
        </div>

      </div>

    </div>
  `;

  view.innerHTML = html;
}
