/**
 * SchoolConnect - Reports Hub Controller
 * Admissions, Daily & Monthly Attendance, Fee Collection, Defaulters, and Teacher Reports
 */

let activeReportType = 'admissions';
let currentReportData = [];

document.addEventListener('DOMContentLoaded', () => {
  switchReport('admissions');

  document.getElementById('btn-export-active-report').addEventListener('click', () => {
    if (!currentReportData.length) {
      Utils.showToast('No data to export', 'warning');
      return;
    }
    Utils.exportToCSV(`SchoolConnect_${activeReportType}_Report`, currentReportData);
  });
});

function switchReport(type) {
  activeReportType = type;

  // Update tabs UI
  const btns = document.querySelectorAll('.report-tab-btn');
  btns.forEach(b => {
    b.classList.remove('active');
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(type)) {
      b.classList.add('active');
    }
  });

  const container = document.getElementById('report-view-container');
  container.innerHTML = '<div class="spinner"></div>';

  if (type === 'admissions') renderAdmissionsReport();
  else if (type === 'attendance-daily') renderDailyAttendanceReport();
  else if (type === 'attendance-monthly') renderMonthlyAttendanceReport();
  else if (type === 'fees-collection') renderFeeCollectionReport();
  else if (type === 'fees-defaulters') renderFeeDefaultersReport();
  else if (type === 'teachers') renderTeacherReport();
}

// ----------------------------------------------------
// 1. ADMISSIONS REPORT
// ----------------------------------------------------
async function renderAdmissionsReport() {
  const container = document.getElementById('report-view-container');

  try {
    const res = await API.reports.getStudents();
    const students = res.data || [];
    currentReportData = students.map(s => ({
      'Student ID': s.studentId,
      'Name': s.fullName,
      'Father Name': s.fatherName,
      'Class': s.className,
      'Section': s.section,
      'Gender': s.gender,
      'Admission Date': s.admissionDate,
      'Monthly Fee': s.monthlyTuitionFee,
      'Status': s.status
    }));

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Student Admissions Directory Report</h2>
            <p>Total Enrolled Students: <strong>${students.length}</strong> &bull; Generated: ${Utils.formatDate(new Date())}</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th>Class & Sec</th>
                <th>Gender</th>
                <th>Admission Date</th>
                <th>Monthly Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td><strong>${s.studentId}</strong></td>
                  <td><strong>${s.fullName}</strong></td>
                  <td>${s.fatherName}</td>
                  <td>${s.className}-${s.section}</td>
                  <td>${s.gender}</td>
                  <td>${Utils.formatDate(s.admissionDate)}</td>
                  <td>${Utils.formatCurrency(s.monthlyTuitionFee)}</td>
                  <td><span class="badge badge-active">${s.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

// ----------------------------------------------------
// 2. DAILY ATTENDANCE REPORT
// ----------------------------------------------------
async function renderDailyAttendanceReport() {
  const container = document.getElementById('report-view-container');
  const today = new Date().toISOString().split('T')[0];

  try {
    const res = await API.reports.getDailyAttendance({ date: today });
    const records = res.data || [];
    const stats = res.stats || { present: 0, absent: 0, late: 0, leave: 0, total: 0, attendanceRate: 0 };

    currentReportData = records.map(r => ({
      'Date': r.date,
      'Student ID': r.studentId,
      'Student Name': r.studentName,
      'Class': r.className,
      'Section': r.section,
      'Status': r.status,
      'Remarks': r.remarks || '',
      'Marked By': r.markedBy
    }));

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card success">
          <div class="stat-content">
            <h3>Present</h3>
            <div class="stat-number" style="color: var(--success);">${stats.present}</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-content">
            <h3>Absent</h3>
            <div class="stat-number" style="color: var(--danger);">${stats.absent}</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-content">
            <h3>Late</h3>
            <div class="stat-number" style="color: #b45309;">${stats.late}</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-content">
            <h3>Attendance Rate</h3>
            <div class="stat-number" style="color: var(--primary);">${stats.attendanceRate}%</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Daily Student Attendance Report &bull; ${Utils.formatDate(today)}</h2>
            <p>Institutional attendance audit log</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class & Sec</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  <td><strong>${r.studentId}</strong></td>
                  <td><strong>${r.studentName}</strong></td>
                  <td>${r.className}-${r.section}</td>
                  <td>
                    <span class="badge ${r.status === 'Present' ? 'badge-present' : r.status === 'Absent' ? 'badge-absent' : r.status === 'Late' ? 'badge-late' : 'badge-leave'}">
                      ${r.status}
                    </span>
                  </td>
                  <td>${r.remarks || '-'}</td>
                  <td>${r.markedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

// ----------------------------------------------------
// 3. MONTHLY ATTENDANCE % REPORT
// ----------------------------------------------------
async function renderMonthlyAttendanceReport() {
  const container = document.getElementById('report-view-container');

  try {
    const res = await API.reports.getMonthlyAttendance({});
    const students = res.data || [];

    currentReportData = students.map(s => ({
      'Student ID': s.studentId,
      'Name': s.fullName,
      'Class': s.className,
      'Section': s.section,
      'Total Days': s.totalDays,
      'Present Days': s.present,
      'Absent Days': s.absent,
      'Late Days': s.late,
      'Leave Days': s.leave,
      'Percentage': `${s.percentage}%`
    }));

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Monthly Attendance Percentage Report</h2>
            <p>Student-wise monthly participation audit</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Total Recorded</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Leave</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td><strong>${s.studentId}</strong></td>
                  <td><strong>${s.fullName}</strong></td>
                  <td>${s.className}-${s.section}</td>
                  <td>${s.totalDays}</td>
                  <td><span style="color: var(--success); font-weight: 700;">${s.present}</span></td>
                  <td><span style="color: var(--danger); font-weight: 700;">${s.absent}</span></td>
                  <td>${s.late}</td>
                  <td>${s.leave}</td>
                  <td>
                    <span class="badge ${s.percentage >= 75 ? 'badge-present' : s.percentage >= 50 ? 'badge-late' : 'badge-absent'}">
                      ${s.percentage}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

// ----------------------------------------------------
// 4. FEE COLLECTION REPORT
// ----------------------------------------------------
async function renderFeeCollectionReport() {
  const container = document.getElementById('report-view-container');

  try {
    const res = await API.reports.getFeeCollection({});
    const { summary, data } = res;
    const fees = data || [];

    currentReportData = fees.map(f => ({
      'Voucher ID': f.feeId,
      'Student Name': f.studentName,
      'Class': f.className,
      'Month': f.month,
      'Total Fee': f.totalFee,
      'Paid Amount': f.paidAmount,
      'Remaining Balance': f.remainingBalance,
      'Status': f.paymentStatus
    }));

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card primary">
          <div class="stat-content">
            <h3>Total Billed</h3>
            <div class="stat-number" style="font-size: 1.5rem;">${Utils.formatCurrency(summary.totalBilled)}</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-content">
            <h3>Total Collected</h3>
            <div class="stat-number" style="color: var(--success); font-size: 1.5rem;">${Utils.formatCurrency(summary.totalCollected)}</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-content">
            <h3>Outstanding Dues</h3>
            <div class="stat-number" style="color: var(--danger); font-size: 1.5rem;">${Utils.formatCurrency(summary.totalOutstanding)}</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-content">
            <h3>Collection Rate</h3>
            <div class="stat-number" style="color: var(--secondary); font-size: 1.5rem;">${summary.collectionRate}%</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Monthly Fee Collection Audit Report</h2>
            <p>Comprehensive collection statement &bull; ${fees.length} vouchers</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Month</th>
                <th>Total Fee</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${fees.map(f => `
                <tr>
                  <td><strong>${f.feeId}</strong></td>
                  <td>${f.studentName}</td>
                  <td>${f.className}-${f.section}</td>
                  <td>${f.month}</td>
                  <td>${Utils.formatCurrency(f.totalFee)}</td>
                  <td><strong style="color: var(--success);">${Utils.formatCurrency(f.paidAmount)}</strong></td>
                  <td><strong style="color: var(--danger);">${Utils.formatCurrency(f.remainingBalance)}</strong></td>
                  <td>
                    <span class="badge ${f.paymentStatus === 'Paid' ? 'badge-paid' : f.paymentStatus === 'Partial' ? 'badge-partial' : f.paymentStatus === 'Overdue' ? 'badge-overdue' : 'badge-pending'}">
                      ${f.paymentStatus}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

// ----------------------------------------------------
// 5. FEE DEFAULTERS & OUTSTANDING REPORT
// ----------------------------------------------------
async function renderFeeDefaultersReport() {
  const container = document.getElementById('report-view-container');

  try {
    const res = await API.reports.getFeeDefaulters({});
    const defaulters = res.data || [];

    currentReportData = defaulters.map(d => ({
      'Voucher ID': d.feeId,
      'Student ID': d.studentId,
      'Student Name': d.studentName,
      'Class': d.className,
      'Section': d.section,
      'Month': d.month,
      'Due Date': d.dueDate,
      'Remaining Balance (PKR)': d.remainingBalance,
      'Status': d.status
    }));

    container.innerHTML = `
      <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;">
        <div class="stat-card danger">
          <div class="stat-content">
            <h3>Total Outstanding Dues</h3>
            <div class="stat-number" style="color: var(--danger);">${Utils.formatCurrency(res.totalOutstandingDues)}</div>
            <div class="stat-subtext">Cumulative unpaid balance</div>
          </div>
          <div class="stat-icon danger"><i class="fa-solid fa-triangle-exclamation"></i></div>
        </div>
        <div class="stat-card warning">
          <div class="stat-content">
            <h3>Defaulter Students Count</h3>
            <div class="stat-number" style="color: #b45309;">${res.totalDefaulters}</div>
            <div class="stat-subtext">Students with remaining fees</div>
          </div>
          <div class="stat-icon warning"><i class="fa-solid fa-user-clock"></i></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2 style="color: var(--danger);">Fee Defaulters & Arrears Report</h2>
            <p>Immediate recovery action list sorted by balance</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Month</th>
                <th>Due Date</th>
                <th>Total Fee</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${defaulters.length ? defaulters.map(d => `
                <tr>
                  <td><strong>${d.feeId}</strong></td>
                  <td>${d.studentId}</td>
                  <td><strong>${d.studentName}</strong></td>
                  <td>${d.className}-${d.section}</td>
                  <td>${d.month}</td>
                  <td>${Utils.formatDate(d.dueDate)}</td>
                  <td>${Utils.formatCurrency(d.totalFee)}</td>
                  <td><strong style="color: var(--danger); font-size: 0.95rem;">${Utils.formatCurrency(d.remainingBalance)}</strong></td>
                  <td>
                    <span class="badge ${d.status === 'Overdue' ? 'badge-overdue' : 'badge-pending'}">
                      ${d.status}
                    </span>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="9" class="empty-state" style="color: var(--success);">All student fee vouchers are fully cleared!</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

// ----------------------------------------------------
// 6. TEACHER STAFF & PAYROLL REPORT
// ----------------------------------------------------
async function renderTeacherReport() {
  const container = document.getElementById('report-view-container');

  try {
    const res = await API.reports.getTeachers();
    const teachers = res.data || [];

    currentReportData = teachers.map(t => ({
      'Teacher ID': t.teacherId,
      'Name': t.fullName,
      'Department': t.subject,
      'Qualification': t.qualification,
      'Assigned Class': t.assignedClass,
      'Monthly Salary (PKR)': t.salary,
      'Joining Date': t.joiningDate,
      'Phone': t.phoneNumber,
      'Status': t.status
    }));

    container.innerHTML = `
      <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;">
        <div class="stat-card primary">
          <div class="stat-content">
            <h3>Total Faculty Members</h3>
            <div class="stat-number">${res.totalStaff}</div>
            <div class="stat-subtext">Teaching faculty</div>
          </div>
          <div class="stat-icon primary"><i class="fa-solid fa-chalkboard-user"></i></div>
        </div>
        <div class="stat-card success">
          <div class="stat-content">
            <h3>Monthly Faculty Payroll</h3>
            <div class="stat-number" style="color: var(--success); font-size: 1.6rem;">${Utils.formatCurrency(res.totalMonthlyPayroll)}</div>
            <div class="stat-subtext">Total monthly salary disbursement</div>
          </div>
          <div class="stat-icon success"><i class="fa-solid fa-money-check-dollar"></i></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Faculty Staff & Payroll Statement</h2>
            <p>Academic faculty profile summary</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Qualification</th>
                <th>Assigned Class</th>
                <th>Contact Phone</th>
                <th>Salary (PKR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.map(t => `
                <tr>
                  <td><strong>${t.teacherId}</strong></td>
                  <td><strong>${t.fullName}</strong></td>
                  <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${t.subject}</span></td>
                  <td>${t.qualification}</td>
                  <td>${t.assignedClass}</td>
                  <td>${t.phoneNumber}</td>
                  <td><strong style="color: var(--success);">${Utils.formatCurrency(t.salary)}</strong></td>
                  <td><span class="badge badge-active">${t.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}
