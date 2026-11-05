/**
 * SchoolConnect - Class & Section Management Controller
 */

let allClasses = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadClasses();

  document.getElementById('btn-open-add-class').addEventListener('click', openAddModal);
  document.getElementById('class-form').addEventListener('submit', handleSaveClass);
});

async function loadClasses() {
  const grid = document.getElementById('classes-stats-grid');
  grid.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await API.classes.getAll();
    allClasses = res.data || [];

    if (allClasses.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1;">
          <div class="card-body empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-school-circle-xmark"></i></div>
            <h3>No Classes Found</h3>
            <p>Get started by defining your school's classes and sections.</p>
            <button class="btn btn-primary" onclick="openAddModal()">Add Class</button>
          </div>
        </div>
      `;
      return;
    }

    const currentUser = API.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    grid.innerHTML = allClasses.map(c => `
      <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div class="card-header" style="background: #f8fafc;">
          <div>
            <h2 style="font-size: 1.25rem; color: var(--primary); font-weight: 800;">${c.name}</h2>
            <small style="color: var(--text-muted);">Grade ${c.numericGrade} &bull; ${c.academicYear || '2025-2026'}</small>
          </div>
          <span class="badge badge-paid" style="font-size: 0.8rem;">
            ${c.studentCount || 0} Students
          </span>
        </div>

        <div class="card-body" style="padding: 1.25rem; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div>
            <strong>Class Teacher:</strong>
            <span style="color: var(--primary); font-weight: 600;">${c.classTeacherName || 'Unassigned'}</span>
          </div>
          <div>
            <strong>Room & Capacity:</strong>
            <span>${c.roomNumber || 'Room 101'} (Max ${c.capacity || 40})</span>
          </div>
          <div>
            <strong>Monthly Fee:</strong>
            <span style="color: var(--success); font-weight: 700;">${Utils.formatCurrency(c.monthlyTuitionFee)}</span>
          </div>
          <div>
            <strong>Sections:</strong>
            <div style="display: flex; gap: 0.3rem; margin-top: 0.2rem; flex-wrap: wrap;">
              ${(c.sections || ['A']).map(sec => `<span class="badge" style="background: #e0f2fe; color: #0284c7;">Section ${sec}</span>`).join('')}
            </div>
          </div>
          <div>
            <strong>Subjects:</strong>
            <div style="display: flex; gap: 0.3rem; margin-top: 0.2rem; flex-wrap: wrap;">
              ${(c.subjects || []).slice(0, 4).map(sub => `<span class="badge" style="background: #f1f5f9; color: #475569;">${sub}</span>`).join('')}
              ${c.subjects && c.subjects.length > 4 ? `<span class="badge" style="background: #f1f5f9; color: #64748b;">+${c.subjects.length - 4} more</span>` : ''}
            </div>
          </div>
        </div>

        <div class="card-header" style="border-top: 1px solid var(--border-color); border-bottom: none; padding: 0.85rem 1.25rem; background: #fafafa;">
          <button class="btn btn-outline btn-sm" onclick="viewClassStudents('${c._id}')">
            <i class="fa-solid fa-users"></i> View Students
          </button>
          ${isAdmin ? `
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline btn-icon btn-sm" title="Edit Class" onclick="openEditModal('${c._id}')">
                <i class="fa-solid fa-pen-to-square" style="color: #0284c7;"></i>
              </button>
              <button class="btn btn-outline btn-icon btn-sm" title="Delete Class" onclick="deleteClass('${c._id}', '${c.name}')">
                <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Error loading classes: ${err.message}</div>`;
  }
}

function openAddModal() {
  isEditing = false;
  document.getElementById('class-modal-title').innerHTML = '<i class="fa-solid fa-school"></i> Add New Class';
  document.getElementById('class-form').reset();
  document.getElementById('class-db-id').value = '';
  Utils.openModal('class-modal');
}

function openEditModal(id) {
  isEditing = true;
  document.getElementById('class-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Class Details';

  const classItem = allClasses.find(c => c._id === id);
  if (!classItem) return;

  document.getElementById('class-db-id').value = classItem._id;
  document.getElementById('form-class-name').value = classItem.name;
  document.getElementById('form-class-grade').value = classItem.numericGrade;
  document.getElementById('form-class-sections').value = (classItem.sections || []).join(', ');
  document.getElementById('form-class-teacher').value = classItem.classTeacherName || '';
  document.getElementById('form-class-room').value = classItem.roomNumber || 'Room 101';
  document.getElementById('form-class-fee').value = classItem.monthlyTuitionFee;
  document.getElementById('form-class-capacity').value = classItem.capacity || 40;
  document.getElementById('form-class-year').value = classItem.academicYear || '2025-2026';
  document.getElementById('form-class-subjects').value = (classItem.subjects || []).join(', ');

  Utils.openModal('class-modal');
}

async function handleSaveClass(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save-class');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const classData = {
    name: document.getElementById('form-class-name').value.trim(),
    numericGrade: Number(document.getElementById('form-class-grade').value),
    sections: document.getElementById('form-class-sections').value.trim(),
    classTeacherName: document.getElementById('form-class-teacher').value.trim(),
    roomNumber: document.getElementById('form-class-room').value.trim(),
    monthlyTuitionFee: Number(document.getElementById('form-class-fee').value),
    capacity: Number(document.getElementById('form-class-capacity').value),
    academicYear: document.getElementById('form-class-year').value.trim(),
    subjects: document.getElementById('form-class-subjects').value.trim()
  };

  const id = document.getElementById('class-db-id').value;

  try {
    if (isEditing && id) {
      await API.classes.update(id, classData);
      Utils.showToast(`Class "${classData.name}" updated successfully!`, 'success');
    } else {
      await API.classes.create(classData);
      Utils.showToast(`Class "${classData.name}" created successfully!`, 'success');
    }

    Utils.closeModal('class-modal');
    await loadClasses();
  } catch (err) {
    Utils.showToast(err.message || 'Operation failed', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Class';
  }
}

async function viewClassStudents(id) {
  const detailCard = document.getElementById('class-detail-card');
  const tbody = document.getElementById('class-students-tbody');
  const title = document.getElementById('class-detail-title');
  const sub = document.getElementById('class-detail-sub');

  detailCard.style.display = 'block';
  tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';
  detailCard.scrollIntoView({ behavior: 'smooth' });

  try {
    const res = await API.classes.getById(id);
    const c = res.data;
    title.innerText = `${c.name} - Enrolled Students (${c.studentCount})`;
    sub.innerText = `Class Teacher: ${c.classTeacherName} &bull; Room: ${c.roomNumber}`;

    if (!c.students || c.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No students currently enrolled in this class.</td></tr>';
      return;
    }

    tbody.innerHTML = c.students.map(s => `
      <tr>
        <td><strong>${s.studentId}</strong></td>
        <td><strong>${s.fullName}</strong></td>
        <td><span class="badge" style="background: #e0f2fe; color: #0284c7;">Section ${s.section}</span></td>
        <td>${s.rollNumber || '-'}</td>
        <td>${s.parentContact}</td>
        <td><span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${s.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

function deleteClass(id, name) {
  Utils.confirmAction({
    title: 'Delete Class',
    message: `Are you sure you want to delete "${name}"?`,
    confirmText: 'Yes, Delete Class',
    onConfirm: async () => {
      try {
        await API.classes.delete(id);
        Utils.showToast(`Class "${name}" deleted successfully!`, 'success');
        await loadClasses();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete class', 'error');
      }
    }
  });
}
