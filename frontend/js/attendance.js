/**
 * SchoolConnect - Attendance Management Controller
 */

let currentStudentsForMarking = [];
let studentAttendanceMap = {}; // studentId -> { status: 'Present'|'Absent'|'Late'|'Leave', remarks: '' }
let historicalAttendance = [];

document.addEventListener('DOMContentLoaded', async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('mark-date-input').value = todayStr;
  document.getElementById('hist-date-filter').value = todayStr;

  // Auto-load class 9 on start
  await loadClassStudentsForMarking();
  await loadAttendanceHistory();

  // Listeners
  document.getElementById('btn-load-class-students').addEventListener('click', loadClassStudentsForMarking);
  document.getElementById('btn-mark-all-present').addEventListener('click', markAllPresent);
  document.getElementById('btn-save-batch-attendance').addEventListener('click', saveBatchAttendance);
  document.getElementById('btn-save-batch-attendance-bottom').addEventListener('click', saveBatchAttendance);

  // History filters
  const histSearch = document.getElementById('hist-search-student');
  const histDate = document.getElementById('hist-date-filter');
  const histClass = document.getElementById('hist-class-filter');
  const histStatus = document.getElementById('hist-status-filter');
  const histReset = document.getElementById('btn-reset-hist-filters');
  const exportBtn = document.getElementById('btn-export-attendance');

  let debounceTimer;
  histSearch.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadAttendanceHistory, 300);
  });
  histDate.addEventListener('change', loadAttendanceHistory);
  histClass.addEventListener('change', loadAttendanceHistory);
  histStatus.addEventListener('change', loadAttendanceHistory);

  histReset.addEventListener('click', () => {
    histSearch.value = '';
    histDate.value = '';
    histClass.value = 'all';
    histStatus.value = 'all';
    loadAttendanceHistory();
  });

  exportBtn.addEventListener('click', () => {
    const exportData = historicalAttendance.map(a => ({
      'Date': a.date,
      'Student ID': a.studentId,
      'Student Name': a.studentName,
      'Class': a.className,
      'Section': a.section,
      'Status': a.status,
      'Remarks': a.remarks || '',
      'Marked By': a.markedBy
    }));
    Utils.exportToCSV('Attendance_Records', exportData);
  });
});

// Tab Switcher
function switchTab(tab) {
  const markSection = document.getElementById('tab-mark-section');
  const historySection = document.getElementById('tab-history-section');
  const markBtn = document.getElementById('tab-mark-btn');
  const historyBtn = document.getElementById('tab-history-btn');

  if (tab === 'mark') {
    markSection.style.display = 'block';
    historySection.style.display = 'none';
    markBtn.classList.add('active');
    historyBtn.classList.remove('active');
  } else {
    markSection.style.display = 'none';
    historySection.style.display = 'block';
    markBtn.classList.remove('active');
    historyBtn.classList.add('active');
    loadAttendanceHistory();
  }
}

// ----------------------------------------------------
// 1. MARK ATTENDANCE FUNCTIONS
// ----------------------------------------------------
async function loadClassStudentsForMarking() {
  const className = document.getElementById('mark-class-select').value;
  const section = document.getElementById('mark-section-select').value;
  const date = document.getElementById('mark-date-input').value;
  const tbody = document.getElementById('attendance-mark-tbody');

  document.getElementById('mark-sheet-title').innerText = `Attendance Sheet \u2022 ${className} (${section !== 'all' ? 'Section ' + section : 'All Sections'})`;
  document.getElementById('mark-sheet-date').innerText = `Date: ${Utils.formatDate(date)}`;

  tbody.innerHTML = '<tr><td colspan="5"><div class="spinner"></div></td></tr>';

  try {
    // 1. Fetch Students
    const params = { className, status: 'Active' };
    if (section !== 'all') params.section = section;
    const stuRes = await API.students.getAll(params);
    currentStudentsForMarking = stuRes.data || [];

    if (currentStudentsForMarking.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No active students found in ${className} ${section !== 'all' ? section : ''}</td></tr>`;
      updateLiveSummary();
      return;
    }

    // 2. Fetch existing attendance for this date & class to pre-fill
    const attRes = await API.attendance.getAll({ date, className, section });
    const existingRecords = attRes.data || [];
    const existingMap = {};
    for (const r of existingRecords) {
      existingMap[r.studentId.toUpperCase()] = r;
    }

    // 3. Populate state
    studentAttendanceMap = {};
    for (const student of currentStudentsForMarking) {
      const existing = existingMap[student.studentId.toUpperCase()];
      studentAttendanceMap[student.studentId] = {
        status: existing ? existing.status : 'Present',
        remarks: existing ? (existing.remarks || '') : ''
      };
    }

    renderMarkingTable();
    updateLiveSummary();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

function renderMarkingTable() {
  const tbody = document.getElementById('attendance-mark-tbody');

  tbody.innerHTML = currentStudentsForMarking.map(student => {
    const current = studentAttendanceMap[student.studentId] || { status: 'Present', remarks: '' };

    return `
      <tr id="row-${student.studentId}">
        <td><strong>${student.rollNumber || '-'}</strong></td>
        <td><strong style="color: var(--primary); font-family: monospace;">${student.studentId}</strong></td>
        <td>
          <strong>${student.fullName}</strong>
          <small style="color: var(--text-muted); display: block;">Father: ${student.fatherName}</small>
        </td>
        <td>
          <div class="attendance-status-group">
            <button type="button" class="att-btn ${current.status === 'Present' ? 'active present' : ''}" onclick="setStatus('${student.studentId}', 'Present')">
              <i class="fa-solid fa-check"></i> Present
            </button>
            <button type="button" class="att-btn ${current.status === 'Absent' ? 'active absent' : ''}" onclick="setStatus('${student.studentId}', 'Absent')">
              <i class="fa-solid fa-xmark"></i> Absent
            </button>
            <button type="button" class="att-btn ${current.status === 'Late' ? 'active late' : ''}" onclick="setStatus('${student.studentId}', 'Late')">
              <i class="fa-solid fa-clock"></i> Late
            </button>
            <button type="button" class="att-btn ${current.status === 'Leave' ? 'active leave' : ''}" onclick="setStatus('${student.studentId}', 'Leave')">
              <i class="fa-solid fa-file-lines"></i> Leave
            </button>
          </div>
        </td>
        <td>
          <input type="text" class="form-control" style="padding: 0.35rem 0.65rem; font-size: 0.82rem;" placeholder="Optional remarks..." value="${current.remarks}" onchange="setRemarks('${student.studentId}', this.value)">
        </td>
      </tr>
    `;
  }).join('');
}

function setStatus(studentId, status) {
  if (!studentAttendanceMap[studentId]) {
    studentAttendanceMap[studentId] = { status, remarks: '' };
  } else {
    studentAttendanceMap[studentId].status = status;
  }

  // Update UI row buttons
  const row = document.getElementById(`row-${studentId}`);
  if (row) {
    const btns = row.querySelectorAll('.att-btn');
    btns.forEach(b => {
      b.className = 'att-btn';
      if (b.innerText.trim().toLowerCase().includes(status.toLowerCase())) {
        b.className = `att-btn active ${status.toLowerCase()}`;
      }
    });
  }

  updateLiveSummary();
}

function setRemarks(studentId, remarks) {
  if (studentAttendanceMap[studentId]) {
    studentAttendanceMap[studentId].remarks = remarks;
  }
}

function markAllPresent() {
  for (const s of currentStudentsForMarking) {
    if (studentAttendanceMap[s.studentId]) {
      studentAttendanceMap[s.studentId].status = 'Present';
    }
  }
  renderMarkingTable();
  updateLiveSummary();
  Utils.showToast('All students marked as Present.', 'info');
}

function updateLiveSummary() {
  let present = 0, absent = 0, late = 0, leave = 0;
  for (const sid of Object.keys(studentAttendanceMap)) {
    const st = studentAttendanceMap[sid].status;
    if (st === 'Present') present++;
    else if (st === 'Absent') absent++;
    else if (st === 'Late') late++;
    else if (st === 'Leave') leave++;
  }

  document.getElementById('badge-present-count').innerText = `Present: ${present}`;
  document.getElementById('badge-absent-count').innerText = `Absent: ${absent}`;
  document.getElementById('badge-late-count').innerText = `Late: ${late}`;
  document.getElementById('badge-leave-count').innerText = `Leave: ${leave}`;
}

async function saveBatchAttendance() {
  if (!currentStudentsForMarking.length) {
    Utils.showToast('No students loaded to mark attendance for.', 'warning');
    return;
  }

  const date = document.getElementById('mark-date-input').value;
  const className = document.getElementById('mark-class-select').value;
  const section = document.getElementById('mark-section-select').value;

  const records = currentStudentsForMarking.map(s => ({
    studentId: s.studentId,
    studentName: s.fullName,
    className: s.className,
    section: s.section,
    status: studentAttendanceMap[s.studentId] ? studentAttendanceMap[s.studentId].status : 'Present',
    remarks: studentAttendanceMap[s.studentId] ? studentAttendanceMap[s.studentId].remarks : ''
  }));

  try {
    const res = await API.attendance.markBulk({
      date,
      className,
      section,
      records
    });
    Utils.showToast(res.message || 'Attendance saved successfully!', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to save attendance', 'error');
  }
}

// ----------------------------------------------------
// 2. ATTENDANCE HISTORY & LOGS
// ----------------------------------------------------
async function loadAttendanceHistory() {
  const tbody = document.getElementById('attendance-history-tbody');
  const countBadge = document.getElementById('history-count-badge');

  const search = document.getElementById('hist-search-student').value.trim();
  const date = document.getElementById('hist-date-filter').value;
  const className = document.getElementById('hist-class-filter').value;
  const status = document.getElementById('hist-status-filter').value;

  tbody.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';

  try {
    const response = await API.attendance.getAll({
      date: date || undefined,
      className: className !== 'all' ? className : undefined,
      status: status !== 'all' ? status : undefined
    });

    let records = response.data || [];
    if (search) {
      const s = search.toLowerCase();
      records = records.filter(r =>
        (r.studentName && r.studentName.toLowerCase().includes(s)) ||
        (r.studentId && r.studentId.toLowerCase().includes(s))
      );
    }

    historicalAttendance = records;
    countBadge.innerText = `Showing ${records.length} record(s)`;

    // Update stats counters
    let p = 0, a = 0, l = 0, lv = 0;
    for (const r of records) {
      if (r.status === 'Present') p++;
      else if (r.status === 'Absent') a++;
      else if (r.status === 'Late') l++;
      else if (r.status === 'Leave') lv++;
    }
    document.getElementById('hist-present').innerText = p;
    document.getElementById('hist-absent').innerText = a;
    document.getElementById('hist-late').innerText = l;
    document.getElementById('hist-leave').innerText = lv;

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No attendance records found for current filters.</td></tr>';
      return;
    }

    const currentUser = API.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = records.map(r => `
      <tr>
        <td><strong>${Utils.formatDate(r.date)}</strong></td>
        <td><strong style="color: var(--primary); font-family: monospace;">${r.studentId}</strong></td>
        <td><strong>${r.studentName}</strong></td>
        <td><span class="badge" style="background: #e0f2fe; color: #0284c7;">${r.className}-${r.section}</span></td>
        <td>
          <span class="badge ${r.status === 'Present' ? 'badge-present' : r.status === 'Absent' ? 'badge-absent' : r.status === 'Late' ? 'badge-late' : 'badge-leave'}">
            ${r.status}
          </span>
        </td>
        <td><small style="color: var(--text-muted);">${r.remarks || '-'}</small></td>
        <td><small>${r.markedBy || 'Admin'}</small></td>
        <td style="text-align: right;">
          ${isAdmin ? `
            <button class="btn btn-outline btn-icon btn-sm" title="Delete Entry" onclick="deleteAttendanceRecord('${r._id}', '${r.studentName}', '${r.date}')">
              <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
            </button>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

function deleteAttendanceRecord(id, studentName, date) {
  Utils.confirmAction({
    title: 'Delete Attendance Entry',
    message: `Delete attendance record for ${studentName} on ${date}?`,
    confirmText: 'Yes, Delete',
    onConfirm: async () => {
      try {
        await API.attendance.delete(id);
        Utils.showToast('Attendance record deleted successfully!', 'success');
        await loadAttendanceHistory();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete record', 'error');
      }
    }
  });
}
