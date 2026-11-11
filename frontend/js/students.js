/**
 * SchoolConnect - Student Management Controller
 * Full CRUD, Search, Filter, Modal Management, ID Generation, and CSV Export
 */

let allStudents = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadStudents();

  // Check URL parameters (e.g. ?action=add)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openAddModal();
  }

  // Event Listeners
  document.getElementById('btn-open-add-student').addEventListener('click', openAddModal);
  document.getElementById('student-form').addEventListener('submit', handleSaveStudent);

  const linkParentForm = document.getElementById('student-link-parent-form');
  if (linkParentForm) {
    linkParentForm.addEventListener('submit', handleStudentSaveParentLink);
  }

  // Search & Filter listeners
  const searchInput = document.getElementById('search-input');
  const classFilter = document.getElementById('filter-class');
  const sectionFilter = document.getElementById('filter-section');
  const statusFilter = document.getElementById('filter-status');
  const resetBtn = document.getElementById('btn-reset-filters');
  const exportBtn = document.getElementById('btn-export-students');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStudents, 300);
  });

  classFilter.addEventListener('change', loadStudents);
  sectionFilter.addEventListener('change', loadStudents);
  statusFilter.addEventListener('change', loadStudents);

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    classFilter.value = 'all';
    sectionFilter.value = 'all';
    statusFilter.value = 'all';
    loadStudents();
  });

  exportBtn.addEventListener('click', () => {
    const exportData = allStudents.map(s => ({
      'Student ID': s.studentId,
      'Full Name': s.fullName,
      'Father Name': s.fatherName,
      'Class': s.className,
      'Section': s.section,
      'Roll No': s.rollNumber || '',
      'Date of Birth': s.dob,
      'Gender': s.gender,
      'Student Contact': s.contactNumber,
      'Parent Contact': s.parentContact,
      'CNIC/B-Form': s.bFormOrCnic || '',
      'Tuition Fee': s.monthlyTuitionFee,
      'Admission Date': s.admissionDate,
      'Status': s.status,
      'Address': s.address
    }));
    Utils.exportToCSV('Students_Directory', exportData);
  });
});

// Load and filter students from API
async function loadStudents() {
  const tbody = document.getElementById('students-tbody');
  const countBadge = document.getElementById('student-count-badge');

  const search = document.getElementById('search-input').value.trim();
  const className = document.getElementById('filter-class').value;
  const section = document.getElementById('filter-section').value;
  const status = document.getElementById('filter-status').value;

  try {
    const response = await API.students.getAll({
      search,
      className,
      section,
      status
    });

    allStudents = response.data || [];
    countBadge.innerText = `Showing ${allStudents.length} enrolled student(s)`;

    if (allStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon"><i class="fa-solid fa-user-slash"></i></div>
              <h3>No Students Found</h3>
              <p>No student records match your current search and filter criteria.</p>
              <button class="btn btn-outline btn-sm" onclick="document.getElementById('btn-reset-filters').click()">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currentUser = API.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = allStudents.map(student => {
      const avatar = student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&background=0ea5e9&color=fff`;

      return `
        <tr>
          <td><strong style="color: var(--primary); font-family: monospace; font-size: 0.95rem;">${student.studentId}</strong></td>
          <td>
            <div class="table-user-cell">
              <img src="${avatar}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" class="table-avatar" alt="${student.fullName}">
              <div class="table-user-info">
                <strong>${student.fullName}</strong>
                <small>${student.gender} • DOB: ${Utils.formatDate(student.dob)}</small>
              </div>
            </div>
          </td>
          <td>${student.fatherName}</td>
          <td><span class="badge" style="background: #e0f2fe; color: #0284c7; font-weight: 700;">${student.className}-${student.section}</span></td>
          <td>${student.rollNumber || '<span style="color: var(--text-light);">-</span>'}</td>
          <td>
            <div style="font-size: 0.82rem;">
              <div><i class="fa-solid fa-phone" style="color: var(--secondary); font-size: 0.75rem; margin-right: 0.25rem;"></i>${student.contactNumber}</div>
              <small style="color: var(--text-muted);"><i class="fa-solid fa-user-shield" style="font-size: 0.7rem; margin-right: 0.25rem;"></i>${student.parentContact}</small>
            </div>
          </td>
          <td>
            <span class="badge ${student.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
              ${student.status}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-outline btn-icon" title="View Profile" onclick="viewStudentDetails('${student._id}')">
              <i class="fa-solid fa-eye" style="color: var(--primary);"></i>
            </button>
            ${isAdmin ? `
              <button class="btn btn-outline btn-icon" title="Edit Student" onclick="openEditModal('${student._id}')">
                <i class="fa-solid fa-pen-to-square" style="color: #0284c7;"></i>
              </button>
              <button class="btn btn-outline btn-icon" title="Delete Student" onclick="deleteStudent('${student._id}', '${student.fullName}', '${student.studentId}')">
                <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Error loading students: ${err.message}</td></tr>`;
  }
}

// Open Add Student Modal
async function openAddModal() {
  isEditing = false;
  document.getElementById('student-modal-title').innerHTML = '<i class="fa-solid fa-user-plus"></i> Register New Student';
  document.getElementById('student-form').reset();
  document.getElementById('student-db-id').value = '';
  document.getElementById('form-admission-date').value = new Date().toISOString().split('T')[0];

  // Auto-generate next Student ID
  try {
    const res = await API.students.getNextId();
    document.getElementById('form-student-id').value = res.studentId;
  } catch (err) {
    console.warn('ID auto-gen note:', err);
  }

  Utils.openModal('student-modal');
}

// Open Edit Student Modal
async function openEditModal(id) {
  isEditing = true;
  document.getElementById('student-modal-title').innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Student Information';

  const student = allStudents.find(s => s._id === id);
  if (!student) return;

  document.getElementById('student-db-id').value = student._id;
  document.getElementById('form-student-id').value = student.studentId;
  document.getElementById('form-full-name').value = student.fullName;
  document.getElementById('form-father-name').value = student.fatherName;
  document.getElementById('form-dob').value = student.dob;
  document.getElementById('form-gender').value = student.gender;
  document.getElementById('form-class').value = student.className;
  document.getElementById('form-section').value = student.section;
  document.getElementById('form-roll-number').value = student.rollNumber || '';
  document.getElementById('form-contact').value = student.contactNumber;
  document.getElementById('form-parent-contact').value = student.parentContact;
  document.getElementById('form-admission-date').value = student.admissionDate || '';
  document.getElementById('form-bform').value = student.bFormOrCnic || '';
  document.getElementById('form-tuition-fee').value = student.monthlyTuitionFee;
  document.getElementById('form-status').value = student.status;
  document.getElementById('form-address').value = student.address;
  document.getElementById('form-photo-url').value = student.photoUrl || '';

  Utils.openModal('student-modal');
}

// Handle Form Submission (Create or Update)
async function handleSaveStudent(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save-student');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const studentData = {
    studentId: document.getElementById('form-student-id').value.trim(),
    fullName: document.getElementById('form-full-name').value.trim(),
    fatherName: document.getElementById('form-father-name').value.trim(),
    dob: document.getElementById('form-dob').value,
    gender: document.getElementById('form-gender').value,
    className: document.getElementById('form-class').value,
    section: document.getElementById('form-section').value,
    rollNumber: document.getElementById('form-roll-number').value.trim(),
    contactNumber: document.getElementById('form-contact').value.trim(),
    parentContact: document.getElementById('form-parent-contact').value.trim(),
    admissionDate: document.getElementById('form-admission-date').value,
    bFormOrCnic: document.getElementById('form-bform').value.trim(),
    monthlyTuitionFee: Number(document.getElementById('form-tuition-fee').value),
    status: document.getElementById('form-status').value,
    address: document.getElementById('form-address').value.trim(),
    photoUrl: document.getElementById('form-photo-url').value.trim()
  };

  const id = document.getElementById('student-db-id').value;

  try {
    if (isEditing && id) {
      await API.students.update(id, studentData);
      Utils.showToast(`Student "${studentData.fullName}" updated successfully!`, 'success');
    } else {
      await API.students.create(studentData);
      Utils.showToast(`Student "${studentData.fullName}" registered successfully!`, 'success');
    }

    Utils.closeModal('student-modal');
    await loadStudents();
  } catch (err) {
    Utils.showToast(err.message || 'Operation failed', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Student Record';
  }
}

// View Student Detailed Profile Modal
async function viewStudentDetails(id) {
  const content = document.getElementById('student-view-content');
  content.innerHTML = '<div class="spinner"></div>';
  Utils.openModal('student-view-modal');

  try {
    const res = await API.students.getById(id);
    const s = res.data;
    const att = s.attendanceStats || { attendanceRate: 0, present: 0, absent: 0, total: 0 };
    const avatar = s.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=0ea5e9&color=fff`;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
        <img src="${avatar}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--secondary);" alt="${s.fullName}">
        <div>
          <h2 style="font-size: 1.4rem; color: var(--primary);">${s.fullName}</h2>
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.2rem;">
            ID: <strong>${s.studentId}</strong> • Class: <strong>${s.className}-${s.section}</strong> • Roll #: <strong>${s.rollNumber || 'N/A'}</strong>
          </div>
          <div style="margin-top: 0.4rem;">
            <span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${s.status}</span>
            <span class="badge badge-paid" style="margin-left: 0.4rem;">Turnout: ${att.attendanceRate}%</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.88rem; margin-bottom: 1.5rem;">
        <div><strong>Father's Name:</strong> ${s.fatherName}</div>
        <div><strong>Gender:</strong> ${s.gender}</div>
        <div><strong>Date of Birth:</strong> ${Utils.formatDate(s.dob)}</div>
        <div><strong>Admission Date:</strong> ${Utils.formatDate(s.admissionDate)}</div>
        <div><strong>Student Contact:</strong> ${s.contactNumber}</div>
        <div><strong>Parent Contact:</strong> ${s.parentContact}</div>
        <div><strong>B-Form / CNIC:</strong> ${s.bFormOrCnic || 'Not registered'}</div>
        <div><strong>Monthly Tuition Fee:</strong> ${Utils.formatCurrency(s.monthlyTuitionFee)}</div>
        <div style="grid-column: span 2;"><strong>Address:</strong> ${s.address}</div>
      </div>

      <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--primary);">
        <i class="fa-solid fa-chart-simple"></i> Attendance Record Summary
      </h4>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; text-align: center; margin-bottom: 1.5rem;">
        <div style="background: var(--bg-main); padding: 0.75rem; border-radius: var(--radius-md);">
          <small style="color: var(--text-muted);">Total Days</small>
          <div style="font-size: 1.25rem; font-weight: 700;">${att.total}</div>
        </div>
        <div style="background: var(--success-bg); padding: 0.75rem; border-radius: var(--radius-md);">
          <small style="color: var(--success);">Present</small>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--success);">${att.present}</div>
        </div>
        <div style="background: var(--danger-bg); padding: 0.75rem; border-radius: var(--radius-md);">
          <small style="color: var(--danger);">Absent</small>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">${att.absent}</div>
        </div>
        <div style="background: #e0f2fe; padding: 0.75rem; border-radius: var(--radius-md);">
          <small style="color: var(--secondary);">Percentage</small>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${att.attendanceRate}%</div>
        </div>
      </div>

      <!-- Linked Parent / Guardian Portal Account Section -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 1.25rem; margin-top: 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
          <h4 style="font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-main);">
            <i class="fa-solid fa-users-between-lines" style="color: var(--primary); margin-right: 6px;"></i>
            Parent Portal Account
          </h4>
          ${s.linkedParent ? `
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="openStudentChangeParentModal('${s._id}', '${s.fullName.replace(/'/g, "\\'")}', '${s.linkedParent._id}')">
                <i class="fa-solid fa-arrows-rotate"></i> Change Parent
              </button>
              <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="handleStudentUnlinkParent('${s._id}', '${s.fullName.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-unlink"></i> Unlink Parent
              </button>
            </div>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="openStudentLinkParentModal('${s._id}', '${s.fullName.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-link"></i> Link Parent Account
            </button>
          `}
        </div>

        ${s.linkedParent ? `
          <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.95rem;">
                ${(s.linkedParent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${s.linkedParent.name}</div>
                <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 10px; margin-top: 2px;">
                  <span><i class="fa-solid fa-envelope"></i> ${s.linkedParent.email}</span>
                  ${s.linkedParent.phone ? `<span><i class="fa-solid fa-phone"></i> ${s.linkedParent.phone}</span>` : ''}
                </div>
              </div>
            </div>
            <div>
              <span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Portal Access Active</span>
            </div>
          </div>
        ` : `
          <div class="alert alert-info" style="margin: 0; padding: 10px 14px; border-radius: 6px; font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <i class="fa-solid fa-circle-info" style="margin-right: 6px;"></i>
              No Parent Portal account is linked to this student. The parent cannot view this student's progress yet.
            </div>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</div>`;
  }
}

// Delete Student with Confirmation Dialog
function deleteStudent(id, name, studentId) {
  Utils.confirmAction({
    title: 'Delete Student Record',
    message: `Are you sure you want to permanently delete student "${name}" (${studentId})? All associated records will be removed.`,
    confirmText: 'Yes, Delete Student',
    onConfirm: async () => {
      try {
        await API.students.delete(id);
        Utils.showToast(`Student "${name}" deleted successfully!`, 'success');
        await loadStudents();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete student', 'error');
      }
    }
  });
}

// Parent linking helpers from Student view
async function openStudentLinkParentModal(studentId, studentName) {
  Utils.closeModal('student-view-modal');
  const title = document.getElementById('student-link-parent-modal-title');
  if (title) title.innerHTML = `<i class="fa-solid fa-link"></i> Link Parent Account`;

  document.getElementById('link-parent-student-id').value = studentId;
  document.getElementById('link-parent-student-name-display').innerText = studentName;

  const select = document.getElementById('select-parent-for-student');
  select.innerHTML = `<option value="">Loading parent accounts...</option>`;

  try {
    const res = await API.parents.getAll();
    const parents = res.data || [];
    if (parents.length === 0) {
      select.innerHTML = `<option value="">No parents found. Please add a parent first.</option>`;
    } else {
      select.innerHTML = `<option value="">-- Choose a Parent Account --</option>` +
        parents.map(p => `<option value="${p._id}">${p.name} [${p.email}]</option>`).join('');
    }
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load parents</option>`;
  }

  Utils.openModal('student-link-parent-modal');
}

async function openStudentChangeParentModal(studentId, studentName, currentParentId) {
  Utils.closeModal('student-view-modal');
  const title = document.getElementById('student-link-parent-modal-title');
  if (title) title.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Change Parent Account`;

  document.getElementById('link-parent-student-id').value = studentId;
  document.getElementById('link-parent-student-name-display').innerText = studentName;

  const select = document.getElementById('select-parent-for-student');
  select.innerHTML = `<option value="">Loading parent accounts...</option>`;

  try {
    const res = await API.parents.getAll();
    const parents = res.data || [];
    select.innerHTML = `<option value="">-- Choose a Parent Account --</option>` +
      parents.map(p => `<option value="${p._id}" ${p._id === currentParentId ? 'selected' : ''}>${p.name} [${p.email}]</option>`).join('');
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load parents</option>`;
  }

  Utils.openModal('student-link-parent-modal');
}

async function handleStudentSaveParentLink(e) {
  e.preventDefault();
  const studentId = document.getElementById('link-parent-student-id').value;
  const parentId = document.getElementById('select-parent-for-student').value;

  if (!studentId || !parentId) {
    Utils.showToast('Please select a parent account.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-save-student-parent-link');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Linking...`;

  try {
    await API.students.linkParent(studentId, parentId);
    Utils.showToast('Parent account linked to student successfully!', 'success');
    Utils.closeModal('student-link-parent-modal');
    await loadStudents();
    viewStudentDetails(studentId);
  } catch (err) {
    console.error('Error linking parent to student:', err);
    Utils.showToast(err.message || 'Failed to link parent account.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function handleStudentUnlinkParent(studentId, studentName) {
  const confirmed = await Utils.confirmAction(
    `Are you sure you want to unlink the parent from "${studentName}"? The student will remain enrolled but the parent will no longer see them.`
  );

  if (!confirmed) return;

  try {
    await API.students.unlinkParent(studentId);
    Utils.showToast('Parent unlinked from student successfully!', 'success');
    viewStudentDetails(studentId);
    await loadStudents();
  } catch (err) {
    console.error('Error unlinking parent from student:', err);
    Utils.showToast(err.message || 'Failed to unlink parent.', 'error');
  }
}


