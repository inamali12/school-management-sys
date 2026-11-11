/**
 * SchoolConnect - Parent Management Controller
 * Handles Parent Account CRUD, Parent-Student Linking/Unlinking, Search, Filter, and Export
 */

let allParents = [];
let allStudents = [];
let isEditing = false;
let currentParentId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial data
  await Promise.all([
    loadParents(),
    loadStudentsList()
  ]);

  // Check URL parameters (e.g. ?action=add or ?action=link&parentId=...)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    openAddParentModal();
  } else if (urlParams.get('action') === 'link') {
    openLinkStudentModal(urlParams.get('parentId'), urlParams.get('studentId'));
  }

  // Event Listeners for action buttons
  const btnAddParent = document.getElementById('btn-open-add-parent');
  if (btnAddParent) {
    btnAddParent.addEventListener('click', openAddParentModal);
  }

  const btnLinkStudent = document.getElementById('btn-open-link-student');
  if (btnLinkStudent) {
    btnLinkStudent.addEventListener('click', () => openLinkStudentModal());
  }

  const parentForm = document.getElementById('parent-form');
  if (parentForm) {
    parentForm.addEventListener('submit', handleSaveParent);
  }

  const linkStudentForm = document.getElementById('link-student-form');
  if (linkStudentForm) {
    linkStudentForm.addEventListener('submit', handleSubmitLink);
  }

  // Modal dynamic "Link Another Child" button in parent view modal
  const btnModalAddChild = document.getElementById('btn-modal-add-child');
  if (btnModalAddChild) {
    btnModalAddChild.addEventListener('click', () => {
      if (currentParentId) {
        Utils.closeModal('parent-view-modal');
        openLinkStudentModal(currentParentId);
      }
    });
  }

  // Search & Filter listeners
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('filter-status');
  const resetBtn = document.getElementById('btn-reset-filters');
  const exportBtn = document.getElementById('btn-export-parents');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadParents, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', loadParents);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      loadParents();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportCSV);
  }

  // Link Preview change listener
  const parentSelect = document.getElementById('link-select-parent');
  const studentSelect = document.getElementById('link-select-student');
  if (parentSelect && studentSelect) {
    parentSelect.addEventListener('change', updateLinkPreview);
    studentSelect.addEventListener('change', updateLinkPreview);
  }
});

/**
 * Load all students for the dropdown selectors
 */
async function loadStudentsList() {
  try {
    const res = await API.students.getAll();
    allStudents = res.data || [];
    populateStudentDropdowns();
  } catch (err) {
    console.error('Failed to load students for selector:', err);
  }
}

/**
 * Populate student dropdowns in Add Parent and Link Student modals
 */
function populateStudentDropdowns() {
  const initialSelect = document.getElementById('form-initial-student');
  const linkSelect = document.getElementById('link-select-student');

  const optionsHtml = allStudents.map(s => {
    const sectionStr = s.section ? `-${s.section}` : '';
    const classStr = s.className ? ` (${s.className}${sectionStr})` : '';
    return `<option value="${s._id}">${s.fullName} - ${s.studentId}${classStr}</option>`;
  }).join('');

  if (initialSelect) {
    initialSelect.innerHTML = `<option value="">-- Do not link right now --</option>` + optionsHtml;
  }

  if (linkSelect) {
    linkSelect.innerHTML = `<option value="">-- Choose a Student --</option>` + optionsHtml;
  }
}

/**
 * Populate parent dropdown in Link Student modal
 */
function populateParentDropdown(selectedParentId = '') {
  const linkParentSelect = document.getElementById('link-select-parent');
  if (!linkParentSelect) return;

  const optionsHtml = allParents.map(p => {
    const childCountStr = (p.linkedChildren && p.linkedChildren.length > 0)
      ? ` (${p.linkedChildren.length} child${p.linkedChildren.length > 1 ? 'ren' : ''})`
      : ' (No children)';
    const selected = (p._id === selectedParentId) ? 'selected' : '';
    return `<option value="${p._id}" ${selected}>${p.name} [${p.email}]${childCountStr}</option>`;
  }).join('');

  linkParentSelect.innerHTML = `<option value="">-- Choose a Parent Account --</option>` + optionsHtml;
}

/**
 * Load and display parents list from backend API
 */
async function loadParents() {
  const tbody = document.getElementById('parents-tbody');
  const countBadge = document.getElementById('parent-count-badge');
  const mobileCardsContainer = document.getElementById('parents-mobile-cards');
  const statTotal = document.getElementById('stat-total-parents');
  const statLinked = document.getElementById('stat-linked-parents');
  const statUnlinked = document.getElementById('stat-unlinked-parents');
  const statRelationships = document.getElementById('stat-total-relationships');

  const search = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : '';
  const filter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'all';

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="spinner"></div></td></tr>`;
  }

  try {
    const res = await API.parents.getAll({ search, filter });
    allParents = res.data || [];

    // Update Summary Stats
    if (res.stats) {
      if (statTotal) statTotal.innerText = res.stats.totalParents ?? allParents.length;
      if (statLinked) statLinked.innerText = res.stats.linkedParents ?? 0;
      if (statUnlinked) statUnlinked.innerText = res.stats.unlinkedParents ?? 0;
      if (statRelationships) statRelationships.innerText = res.stats.totalRelationships ?? 0;
    }

    if (countBadge) {
      countBadge.innerText = `Showing ${allParents.length} parent account(s)`;
    }

    if (allParents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-state-icon"><i class="fa-solid fa-users-slash"></i></div>
              <h3>No Parent Records Found</h3>
              <p>No parent accounts match your current search and filter criteria.</p>
              <button class="btn btn-outline btn-sm" onclick="document.getElementById('btn-reset-filters').click()">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-users-slash"></i></div>
            <h3>No Parent Records Found</h3>
            <p>No parent accounts match your current search and filter criteria.</p>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('btn-reset-filters').click()">Clear Filters</button>
          </div>
        `;
      }
      return;
    }

    // Render Table Rows
    tbody.innerHTML = allParents.map(parent => {
      const initials = (parent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const linkedChildren = parent.linkedChildren || [];
      const hasChildren = linkedChildren.length > 0;

      // Badges for linked children
      let childrenHtml = '';
      if (hasChildren) {
        childrenHtml = `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${linkedChildren.map(c => `
              <div style="display: inline-flex; align-items: center; justify-content: space-between; gap: 6px; background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.2); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">
                <span>
                  <strong>${c.fullName}</strong>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">(${c.studentId || ''} &bull; ${c.className || ''} ${c.section || ''})</span>
                </span>
                <button type="button" class="btn-icon" style="color: var(--danger); padding: 0 4px; font-size: 0.75rem;" title="Unlink Child" onclick="unlinkChild('${parent._id}', '${c._id}', '${c.fullName.replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        childrenHtml = `
          <span class="badge badge-warning" style="display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-exclamation"></i> No Children Linked
          </span>
        `;
      }

      // Status Badge
      const statusBadge = hasChildren
        ? `<span class="badge badge-success"><i class="fa-solid fa-link"></i> Linked (${linkedChildren.length})</span>`
        : `<span class="badge badge-warning"><i class="fa-solid fa-unlink"></i> Unlinked</span>`;

      const regDate = parent.createdAt ? Utils.formatDate(parent.createdAt) : 'N/A';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="user-avatar" style="width: 38px; height: 38px; font-size: 0.85rem; background: var(--primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                ${initials}
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${parent.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  <i class="fa-solid fa-user-tag" style="margin-right: 3px;"></i>${parent.username || 'Parent'}
                </div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size: 0.88rem;">
              <a href="mailto:${parent.email}" style="color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-envelope" style="font-size: 0.8rem;"></i> ${parent.email}
              </a>
              <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-phone" style="font-size: 0.8rem;"></i> ${parent.phone || 'N/A'}
              </div>
            </div>
          </td>
          <td style="min-width: 240px;">
            ${childrenHtml}
          </td>
          <td>
            ${statusBadge}
          </td>
          <td style="color: var(--text-muted); font-size: 0.85rem;">
            ${regDate}
          </td>
          <td style="text-align: right;">
            <div class="table-actions" style="justify-content: flex-end; gap: 6px;">
              <button class="btn-icon" title="View Profile & Children" onclick="viewParent('${parent._id}')">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn-icon" style="color: #8b5cf6;" title="Link Student" onclick="openLinkStudentModal('${parent._id}')">
                <i class="fa-solid fa-link"></i>
              </button>
              <button class="btn-icon" title="Edit Parent Details" onclick="openEditParentModal('${parent._id}')">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon btn-delete" title="Delete Parent Account" onclick="deleteParent('${parent._id}', '${parent.name.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Mobile Cards (<= 768px)
    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = allParents.map(parent => {
        const initials = (parent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const linkedChildren = parent.linkedChildren || [];
        const hasChildren = linkedChildren.length > 0;

        return `
          <div class="mobile-data-card">
            <div class="m-card-header">
              <div class="m-card-avatar" style="background: var(--primary);">
                ${initials}
              </div>
              <div class="m-card-title-box">
                <div class="m-card-name-row">
                  <h3 class="m-card-name">${parent.name}</h3>
                  ${hasChildren 
                    ? `<span class="badge badge-success"><i class="fa-solid fa-link"></i> Linked (${linkedChildren.length})</span>`
                    : `<span class="badge badge-warning"><i class="fa-solid fa-unlink"></i> Unlinked</span>`
                  }
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                  <i class="fa-solid fa-user-tag"></i> ${parent.username || 'Parent'}
                </div>
              </div>
            </div>

            <div class="m-card-details-grid">
              <div class="m-card-field">
                <span class="label">Email</span>
                <span class="value"><a href="mailto:${parent.email}">${parent.email}</a></span>
              </div>
              <div class="m-card-field">
                <span class="label">Phone</span>
                <span class="value"><a href="tel:${parent.phone || ''}">${parent.phone || 'N/A'}</a></span>
              </div>
              <div class="m-card-field col-span-2">
                <span class="label">Linked Children</span>
                <div class="value" style="font-weight: normal; white-space: normal;">
                  ${hasChildren ? linkedChildren.map(c => `
                    <div style="display: inline-flex; align-items: center; justify-content: space-between; gap: 4px; background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; margin: 2px 2px 2px 0;">
                      <span><strong>${c.fullName}</strong> (${c.studentId})</span>
                      <button type="button" class="btn-icon" style="color: var(--danger); width: 20px; height: 20px; font-size: 0.7rem; padding: 0;" title="Unlink" onclick="unlinkChild('${parent._id}', '${c._id}', '${c.fullName.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  `).join('') : '<span style="color: var(--text-muted);">No children linked</span>'}
                </div>
              </div>
            </div>

            <div class="m-card-actions">
              <button class="btn btn-outline btn-sm" onclick="viewParent('${parent._id}')">
                <i class="fa-solid fa-eye"></i> View Profile
              </button>
              <button class="btn btn-outline btn-sm" style="color: #8b5cf6;" onclick="openLinkStudentModal('${parent._id}')">
                <i class="fa-solid fa-link"></i> Link Child
              </button>
              <button class="btn btn-outline btn-sm" onclick="openEditParentModal('${parent._id}')">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger-border);" onclick="deleteParent('${parent._id}', '${parent.name.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Error loading parents:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h3>Failed to Load Parents</h3>
            <p>${err.message || 'Unable to connect to the parent management API.'}</p>
            <button class="btn btn-primary btn-sm" onclick="loadParents()"><i class="fa-solid fa-rotate"></i> Retry</button>
          </div>
        </td>
      </tr>
    `;
  }
}

/**
 * Open Modal to Add a New Parent
 */
function openAddParentModal() {
  isEditing = false;
  currentParentId = null;

  document.getElementById('parent-modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> Register Parent Account`;
  document.getElementById('parent-form').reset();
  document.getElementById('parent-db-id').value = '';

  const pwdInput = document.getElementById('form-parent-password');
  const pwdLabel = document.getElementById('label-parent-password');
  const pwdHelper = document.getElementById('helper-parent-password');
  const initialGroup = document.getElementById('group-initial-student');

  pwdInput.required = true;
  pwdLabel.innerHTML = `Account Password <span class="required">*</span>`;
  pwdHelper.innerText = `Required for Parent Portal login (Minimum 6 characters)`;
  if (initialGroup) initialGroup.style.display = 'block';

  Utils.openModal('parent-modal');
}

/**
 * Open Modal to Edit an Existing Parent
 */
function openEditParentModal(id) {
  const parent = allParents.find(p => p._id === id);
  if (!parent) return;

  isEditing = true;
  currentParentId = id;

  document.getElementById('parent-modal-title').innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Parent Profile`;
  document.getElementById('parent-db-id').value = parent._id;
  document.getElementById('form-parent-name').value = parent.name || '';
  document.getElementById('form-parent-email').value = parent.email || '';
  document.getElementById('form-parent-phone').value = parent.phone || '';
  document.getElementById('form-parent-address').value = parent.address || '';

  const pwdInput = document.getElementById('form-parent-password');
  const pwdLabel = document.getElementById('label-parent-password');
  const pwdHelper = document.getElementById('helper-parent-password');
  const initialGroup = document.getElementById('group-initial-student');

  pwdInput.value = '';
  pwdInput.required = false;
  pwdLabel.innerHTML = `Account Password (Optional)`;
  pwdHelper.innerText = `Leave blank to keep existing password unchanged`;
  if (initialGroup) initialGroup.style.display = 'none';

  Utils.openModal('parent-modal');
}

/**
 * Handle Add/Edit Parent Form Submission
 */
async function handleSaveParent(e) {
  e.preventDefault();

  const name = document.getElementById('form-parent-name').value.trim();
  const email = document.getElementById('form-parent-email').value.trim();
  const phone = document.getElementById('form-parent-phone').value.trim();
  const address = document.getElementById('form-parent-address').value.trim();
  const password = document.getElementById('form-parent-password').value;
  const initialStudentId = document.getElementById('form-initial-student') ? document.getElementById('form-initial-student').value : '';

  if (!name || !email || !phone) {
    Utils.showToast('Please fill all required fields.', 'error');
    return;
  }

  const saveBtn = document.getElementById('btn-save-parent');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    if (isEditing && currentParentId) {
      const payload = { name, email, phone, address };
      if (password && password.trim().length >= 6) {
        payload.password = password.trim();
      }
      await API.parents.update(currentParentId, payload);
      Utils.showToast('Parent account updated successfully!', 'success');
    } else {
      if (!password || password.length < 6) {
        Utils.showToast('Password must be at least 6 characters long.', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        return;
      }
      const payload = { name, email, phone, address, password };
      if (initialStudentId) {
        payload.studentId = initialStudentId;
      }
      await API.parents.create(payload);
      Utils.showToast('Parent account registered successfully!', 'success');
    }

    Utils.closeModal('parent-modal');
    await loadParents();
  } catch (err) {
    console.error('Error saving parent:', err);
    Utils.showToast(err.message || 'Failed to save parent account.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

/**
 * Open Modal to Link Student to Parent
 */
function openLinkStudentModal(preselectParentId = '', preselectStudentId = '') {
  populateParentDropdown(preselectParentId);
  populateStudentDropdowns();

  const parentSelect = document.getElementById('link-select-parent');
  const studentSelect = document.getElementById('link-select-student');

  if (parentSelect && preselectParentId) {
    parentSelect.value = preselectParentId;
  }

  if (studentSelect && preselectStudentId) {
    studentSelect.value = preselectStudentId;
  }

  updateLinkPreview();
  Utils.openModal('link-student-modal');
}

/**
 * Update live preview when selecting parent/student
 */
function updateLinkPreview() {
  const parentSelect = document.getElementById('link-select-parent');
  const studentSelect = document.getElementById('link-select-student');
  const previewBox = document.getElementById('link-preview-box');
  const previewText = document.getElementById('link-preview-text');

  if (!previewBox || !previewText) return;

  const pId = parentSelect ? parentSelect.value : '';
  const sId = studentSelect ? studentSelect.value : '';

  if (pId && sId) {
    const parent = allParents.find(p => p._id === pId);
    const student = allStudents.find(s => s._id === sId);

    if (parent && student) {
      previewBox.style.display = 'block';
      previewText.innerHTML = `Linking <strong>${student.fullName}</strong> (${student.studentId} - ${student.className || ''}) to parent <strong>${parent.name}</strong> (${parent.email}).`;
      return;
    }
  }

  previewBox.style.display = 'none';
}

/**
 * Handle Confirm Link Student form submission
 */
async function handleSubmitLink(e) {
  e.preventDefault();

  const parentId = document.getElementById('link-select-parent').value;
  const studentId = document.getElementById('link-select-student').value;

  if (!parentId || !studentId) {
    Utils.showToast('Please select both a parent and a student.', 'warning');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-link');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Linking...`;

  try {
    await API.parents.linkStudent(parentId, studentId);
    Utils.showToast('Student successfully linked to parent!', 'success');
    Utils.closeModal('link-student-modal');

    // Refresh parent list and if view modal is open, re-render view modal
    await loadParents();
    if (currentParentId === parentId) {
      viewParent(parentId);
    }
  } catch (err) {
    console.error('Error linking student:', err);
    Utils.showToast(err.message || 'Failed to link student to parent.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Unlink student from parent
 */
async function unlinkChild(parentId, studentId, studentName) {
  const confirmed = await Utils.confirmAction(
    `Are you sure you want to unlink ${studentName} from this parent? The student's academic and enrollment record will NOT be deleted.`
  );

  if (!confirmed) return;

  try {
    await API.parents.unlinkStudent(parentId, studentId);
    Utils.showToast(`${studentName} unlinked successfully!`, 'success');

    await loadParents();
    if (currentParentId === parentId) {
      viewParent(parentId);
    }
  } catch (err) {
    console.error('Error unlinking student:', err);
    Utils.showToast(err.message || 'Failed to unlink student.', 'error');
  }
}

/**
 * View Parent details and all linked children
 */
async function viewParent(id) {
  currentParentId = id;
  const container = document.getElementById('parent-view-content');
  if (!container) return;

  container.innerHTML = `<div class="spinner"></div>`;
  Utils.openModal('parent-view-modal');

  try {
    const res = await API.parents.getById(id);
    const parent = res.data;

    if (!parent) {
      container.innerHTML = `<div class="alert alert-danger">Parent record not found.</div>`;
      return;
    }

    const initials = (parent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const children = parent.linkedChildren || [];

    let childrenCards = '';
    if (children.length === 0) {
      childrenCards = `
        <div class="empty-state" style="padding: 24px; background: var(--bg-surface); border-radius: 8px; border: 1px dashed var(--border-color); text-align: center;">
          <div class="empty-state-icon" style="color: var(--warning); margin-bottom: 8px;"><i class="fa-solid fa-child-reaching"></i></div>
          <h4 style="margin-bottom: 6px;">No Children Linked to This Account</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">This parent currently cannot see any student records in their Parent Portal.</p>
          <button class="btn btn-primary btn-sm" onclick="Utils.closeModal('parent-view-modal'); openLinkStudentModal('${parent._id}');">
            <i class="fa-solid fa-link"></i> Link a Student Now
          </button>
        </div>
      `;
    } else {
      childrenCards = children.map(c => {
        const attRate = c.attendanceRate !== undefined ? `${c.attendanceRate}%` : 'N/A';
        const feeStatus = c.pendingFees > 0
          ? `<span class="badge badge-warning">Due: PKR ${c.pendingFees.toLocaleString()}</span>`
          : `<span class="badge badge-success">Fees Clear</span>`;

        return `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-weight: 700; font-size: 1rem; color: var(--text-main);">${c.fullName}</span>
                <span class="badge badge-info" style="margin-left: 6px;">${c.studentId}</span>
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 6px;">
                  Class: <strong>${c.className || 'N/A'} - ${c.section || 'A'}</strong> | Roll #: <strong>${c.rollNumber || 'N/A'}</strong>
                </span>
              </div>
              <div>
                <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="unlinkChild('${parent._id}', '${c._id}', '${c.fullName.replace(/'/g, "\\'")}')">
                  <i class="fa-solid fa-unlink"></i> Unlink Child
                </button>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; background: var(--bg-body); padding: 10px; border-radius: 6px; font-size: 0.85rem;">
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Status</span>
                <span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}">${c.status || 'Active'}</span>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Attendance Rate</span>
                <strong>${attRate}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Fee Status</span>
                ${feeStatus}
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Father's Name</span>
                <span>${c.fatherName || 'N/A'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <!-- Parent Header Banner -->
      <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 8px; margin-bottom: 20px;">
        <div class="user-avatar" style="width: 56px; height: 56px; font-size: 1.25rem; background: var(--primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">
          ${initials}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 4px 0; font-size: 1.2rem; color: var(--text-main);">${parent.name}</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.85rem; color: var(--text-muted);">
            <span><i class="fa-solid fa-envelope"></i> ${parent.email}</span>
            <span><i class="fa-solid fa-phone"></i> ${parent.phone || 'N/A'}</span>
            <span><i class="fa-solid fa-user-tag"></i> Role: Parent (${parent.username || 'parent'})</span>
          </div>
          ${parent.address ? `<div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${parent.address}</div>` : ''}
        </div>
      </div>

      <!-- Linked Children Section -->
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 1rem; color: var(--text-main);">
            <i class="fa-solid fa-children" style="color: var(--primary); margin-right: 6px;"></i>
            Linked Children (${children.length})
          </h4>
        </div>
        ${childrenCards}
      </div>
    `;

  } catch (err) {
    console.error('Error viewing parent:', err);
    container.innerHTML = `<div class="alert alert-danger">Failed to load parent details: ${err.message}</div>`;
  }
}

/**
 * Delete a parent account
 */
async function deleteParent(id, name) {
  const confirmed = await Utils.confirmAction(
    `Are you sure you want to delete the parent account for "${name}"?\n\nNote: Any linked student accounts will NOT be deleted, but will become unlinked.`
  );

  if (!confirmed) return;

  try {
    await API.parents.delete(id);
    Utils.showToast(`Parent account for "${name}" deleted successfully.`, 'success');
    await loadParents();
  } catch (err) {
    console.error('Error deleting parent:', err);
    Utils.showToast(err.message || 'Failed to delete parent account.', 'error');
  }
}

/**
 * Export parents to CSV
 */
function handleExportCSV() {
  if (!allParents || allParents.length === 0) {
    Utils.showToast('No parent records to export.', 'warning');
    return;
  }

  const exportData = allParents.map(p => ({
    'Parent Name': p.name || '',
    'Email Address': p.email || '',
    'Phone Number': p.phone || '',
    'Address': p.address || '',
    'Username': p.username || '',
    'Linked Children Count': (p.linkedChildren || []).length,
    'Linked Children Details': (p.linkedChildren || []).map(c => `${c.fullName} (${c.studentId})`).join('; '),
    'Registered Date': p.createdAt ? Utils.formatDate(p.createdAt) : ''
  }));

  Utils.exportToCSV('Parents_Directory', exportData);
}

