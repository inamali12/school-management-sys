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

    const currentUser = API.getUser();

    if (response.role === 'admin') {
      renderAdminDashboard(response);
    } else if (response.role === 'teacher') {
      renderTeacherDashboard(response);
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
  const totalBilled = (stats.financial.totalCollected || 0) + (stats.financial.totalPending || 0);

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
    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 2rem;">
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
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
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

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
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
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
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
                      <img src="${s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="table-avatar" alt="${s.fullName}">
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
  if (welcomeHeading) welcomeHeading.innerText = `Teacher Portal &bull; ${teacherProfile ? teacherProfile.fullName : 'Faculty'}`;
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
                    <img src="${s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="table-avatar" alt="${s.fullName}">
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
  if (welcomeHeading) welcomeHeading.innerText = `Parent Portal &bull; Welcome, ${parentName}`;
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
          <div class="card" style="border: 2px solid #e0f2fe;">
            <div class="card-header" style="background: linear-gradient(90deg, #f0f9ff, #ffffff);">
              <div class="table-user-cell">
                <img src="${child.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="table-avatar" style="width: 52px; height: 52px;" alt="${child.fullName}">
                <div class="table-user-info">
                  <h2 style="font-size: 1.3rem; color: var(--primary);">${child.fullName}</h2>
                  <p style="font-size: 0.85rem; color: var(--text-muted);">
                    ID: <strong>${child.studentId}</strong> &bull; Class: <strong>${child.className}-${child.section}</strong> &bull; Roll #: <strong>${child.rollNumber || 'N/A'}</strong>
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
