/**
 * SchoolConnect - Teacher Management Controller
 * Full CRUD, Search, Filter, Modal Management, ID Generation, and CSV Export
 */

let allTeachers = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadTeachers();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openAddModal();
  }

  document.getElementById('btn-open-add-teacher').addEventListener('click', openAddModal);
  document.getElementById('teacher-form').addEventListener('submit', handleSaveTeacher);

  const searchInput = document.getElementById('search-input');
  const subjectFilter = document.getElementById('filter-subject');
  const statusFilter = document.getElementById('filter-status');
  const classFilter = document.getElementById('filter-class');
  const resetBtn = document.getElementById('btn-reset-filters');
  const exportBtn = document.getElementById('btn-export-teachers');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTeachers, 300);
  });

  subjectFilter.addEventListener('change', loadTeachers);
  statusFilter.addEventListener('change', loadTeachers);
  classFilter.addEventListener('change', loadTeachers);

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    subjectFilter.value = 'all';
    statusFilter.value = 'all';
    classFilter.value = 'all';
    loadTeachers();
  });

  exportBtn.addEventListener('click', () => {
    const exportData = allTeachers.map(t => ({
      'Teacher ID': t.teacherId,
      'Full Name': t.fullName,
      'Email': t.email,
      'Phone Number': t.phoneNumber,
      'Primary Subject': t.subject,
      'Assigned Subjects': (t.assignedSubjects || []).join(', '),
      'Assigned Class': t.assignedClass,
      'Teaching Classes': (t.assignedClasses || []).join(', '),
      'Qualification': t.qualification,
      'Salary (PKR)': t.salary,
      'Joining Date': t.joiningDate,
      'CNIC': t.cnic || '',
      'Status': t.status,
      'Address': t.address
    }));
    Utils.exportToCSV('Faculty_Directory', exportData);
  });
});

async function loadTeachers() {
  const tbody = document.getElementById('teachers-tbody');
  const countBadge = document.getElementById('teacher-count-badge');

  const search = document.getElementById('search-input').value.trim();
  const subject = document.getElementById('filter-subject').value;
  const status = document.getElementById('filter-status').value;
  const assignedClass = document.getElementById('filter-class').value;

  try {
    const response = await API.teachers.getAll({
      search,
      subject,
      status,
      assignedClass
    });

    allTeachers = response.data || [];
    countBadge.innerText = `Showing ${allTeachers.length} faculty member(s)`;

    if (allTeachers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon"><i class="fa-solid fa-user-slash"></i></div>
              <h3>No Teachers Found</h3>
              <p>No faculty records match your current filters.</p>
              <button class="btn btn-outline btn-sm" onclick="document.getElementById('btn-reset-filters').click()">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currentUser = API.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = allTeachers.map(teacher => {
      const avatar = teacher.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.fullName)}&background=1e3a8a&color=fff`;

      return `
        <tr>
          <td><strong style="color: var(--primary); font-family: monospace; font-size: 0.95rem;">${teacher.teacherId}</strong></td>
          <td>
            <div class="table-user-cell">
              <img src="${avatar}" class="table-avatar" alt="${teacher.fullName}">
              <div class="table-user-info">
                <strong>${teacher.fullName}</strong>
                <small>${teacher.email}</small>
              </div>
            </div>
          </td>
          <td><span class="badge" style="background: #f0fdf4; color: #166534; font-weight: 700;">${teacher.subject}</span></td>
          <td>
            ${teacher.assignedClasses && teacher.assignedClasses.length
              ? teacher.assignedClasses.map(c => `<span class="badge" style="background: #e0f2fe; color: #0369a1; margin: 1px;">${c}</span>`).join('')
              : '<span style="color: var(--text-light); font-size: 0.8rem;">Unassigned</span>'}
          </td>
          <td><small style="color: #475569;">${teacher.qualification}</small></td>
          <td><i class="fa-solid fa-phone" style="color: var(--secondary); font-size: 0.75rem; margin-right: 0.25rem;"></i>${teacher.phoneNumber}</td>
          <td><strong style="color: var(--success);">${Utils.formatCurrency(teacher.salary)}</strong></td>
          <td>
            <span class="badge ${teacher.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
              ${teacher.status}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-outline btn-icon" title="View Profile" onclick="viewTeacherDetails('${teacher._id}')">
              <i class="fa-solid fa-eye" style="color: var(--primary);"></i>
            </button>
            ${isAdmin ? `
              <button class="btn btn-outline btn-icon" title="Edit Teacher" onclick="openEditModal('${teacher._id}')">
                <i class="fa-solid fa-pen-to-square" style="color: #0284c7;"></i>
              </button>
              <button class="btn btn-outline btn-icon" title="Delete Teacher" onclick="deleteTeacher('${teacher._id}', '${teacher.fullName}', '${teacher.teacherId}')">
                <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Error loading teachers: ${err.message}</td></tr>`;
  }
}

async function openAddModal() {
  isEditing = false;
  document.getElementById('teacher-modal-title').innerHTML = '<i class="fa-solid fa-user-plus"></i> Register Faculty Member';
  document.getElementById('teacher-form').reset();
  document.getElementById('teacher-db-id').value = '';
  document.getElementById('form-teacher-joining').value = new Date().toISOString().split('T')[0];

  try {
    const res = await API.teachers.getNextId();
    document.getElementById('form-teacher-id').value = res.teacherId;
  } catch (err) {
    console.warn('ID auto-gen note:', err);
  }

  Utils.openModal('teacher-modal');
}

async function openEditModal(id) {
  isEditing = true;
  document.getElementById('teacher-modal-title').innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Faculty Information';

  const teacher = allTeachers.find(t => t._id === id);
  if (!teacher) return;

  document.getElementById('teacher-db-id').value = teacher._id;
  document.getElementById('form-teacher-id').value = teacher.teacherId;
  document.getElementById('form-teacher-name').value = teacher.fullName;
  document.getElementById('form-teacher-email').value = teacher.email;
  document.getElementById('form-teacher-phone').value = teacher.phoneNumber;
  document.getElementById('form-teacher-qualification').value = teacher.qualification;
  document.getElementById('form-teacher-subject').value = teacher.subject;
  document.getElementById('form-teacher-subjects').value = (teacher.assignedSubjects || []).join(', ');
  document.getElementById('form-teacher-class').value = teacher.assignedClass || 'None';
  document.getElementById('form-teacher-classes').value = (teacher.assignedClasses || []).join(', ');
  document.getElementById('form-teacher-salary').value = teacher.salary;
  document.getElementById('form-teacher-joining').value = teacher.joiningDate || '';
  document.getElementById('form-teacher-status').value = teacher.status;
  document.getElementById('form-teacher-cnic').value = teacher.cnic || '';
  document.getElementById('form-teacher-address').value = teacher.address;
  document.getElementById('form-teacher-photo').value = teacher.photoUrl || '';

  Utils.openModal('teacher-modal');
}

async function handleSaveTeacher(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save-teacher');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const teacherData = {
    teacherId: document.getElementById('form-teacher-id').value.trim(),
    fullName: document.getElementById('form-teacher-name').value.trim(),
    email: document.getElementById('form-teacher-email').value.trim(),
    phoneNumber: document.getElementById('form-teacher-phone').value.trim(),
    qualification: document.getElementById('form-teacher-qualification').value.trim(),
    subject: document.getElementById('form-teacher-subject').value.trim(),
    assignedSubjects: document.getElementById('form-teacher-subjects').value.trim(),
    assignedClass: document.getElementById('form-teacher-class').value,
    assignedClasses: document.getElementById('form-teacher-classes').value.trim(),
    salary: Number(document.getElementById('form-teacher-salary').value),
    joiningDate: document.getElementById('form-teacher-joining').value,
    status: document.getElementById('form-teacher-status').value,
    cnic: document.getElementById('form-teacher-cnic').value.trim(),
    address: document.getElementById('form-teacher-address').value.trim(),
    photoUrl: document.getElementById('form-teacher-photo').value.trim()
  };

  const id = document.getElementById('teacher-db-id').value;

  try {
    if (isEditing && id) {
      await API.teachers.update(id, teacherData);
      Utils.showToast(`Faculty "${teacherData.fullName}" updated successfully!`, 'success');
    } else {
      await API.teachers.create(teacherData);
      Utils.showToast(`Faculty "${teacherData.fullName}" registered successfully!`, 'success');
    }

    Utils.closeModal('teacher-modal');
    await loadTeachers();
  } catch (err) {
    Utils.showToast(err.message || 'Operation failed', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Teacher Record';
  }
}

async function viewTeacherDetails(id) {
  const content = document.getElementById('teacher-view-content');
  content.innerHTML = '<div class="spinner"></div>';
  Utils.openModal('teacher-view-modal');

  try {
    const res = await API.teachers.getById(id);
    const t = res.data;
    const avatar = t.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName)}&background=1e3a8a&color=fff`;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
        <img src="${avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);" alt="${t.fullName}">
        <div>
          <h2 style="font-size: 1.4rem; color: var(--primary);">${t.fullName}</h2>
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.2rem;">
            ID: <strong>${t.teacherId}</strong> &bull; Department: <strong>${t.subject}</strong> &bull; Class Teacher: <strong>${t.assignedClass}</strong>
          </div>
          <div style="margin-top: 0.4rem;">
            <span class="badge ${t.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${t.status}</span>
            <span class="badge" style="background: #e0f2fe; color: #0369a1; margin-left: 0.4rem;">${t.qualification}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; font-size: 0.88rem;">
        <div><strong>Official Email:</strong> ${t.email}</div>
        <div><strong>Contact Phone:</strong> ${t.phoneNumber}</div>
        <div><strong>Joining Date:</strong> ${Utils.formatDate(t.joiningDate)}</div>
        <div><strong>Monthly Salary:</strong> <span style="color: var(--success); font-weight: 700;">${Utils.formatCurrency(t.salary)}</span></div>
        <div><strong>CNIC Number:</strong> ${t.cnic || 'N/A'}</div>
        <div><strong>Assigned Subjects:</strong> ${(t.assignedSubjects || []).join(', ') || t.subject}</div>
        <div><strong>Assigned Classes:</strong> ${(t.assignedClasses || []).join(', ') || t.assignedClass}</div>
        <div><strong>Residential Address:</strong> ${t.address}</div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</div>`;
  }
}

function deleteTeacher(id, name, teacherId) {
  Utils.confirmAction({
    title: 'Delete Faculty Member',
    message: `Are you sure you want to delete "${name}" (${teacherId}) from faculty records?`,
    confirmText: 'Yes, Delete Teacher',
    onConfirm: async () => {
      try {
        await API.teachers.delete(id);
        Utils.showToast(`Faculty "${name}" deleted successfully!`, 'success');
        await loadTeachers();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete teacher', 'error');
      }
    }
  });
}

