/**
 * SchoolConnect - User Management Controller
 */

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadUsers();

  document.getElementById('btn-open-add-user').addEventListener('click', () => {
    document.getElementById('user-form').reset();
    document.getElementById('parent-links-group').style.display = 'none';
    Utils.openModal('user-modal');
  });

  document.getElementById('form-user-role').addEventListener('change', (e) => {
    const parentGroup = document.getElementById('parent-links-group');
    if (e.target.value === 'parent') {
      parentGroup.style.display = 'block';
    } else {
      parentGroup.style.display = 'none';
    }
  });

  document.getElementById('user-form').addEventListener('submit', handleSaveUser);
});

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  const countBadge = document.getElementById('users-count-badge');
  const mobileCardsContainer = document.getElementById('users-mobile-cards');

  tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

  try {
    const res = await API.users.getAll();
    allUsers = res.data || [];
    countBadge.innerText = `Showing ${allUsers.length} user account(s)`;

    if (allUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users registered yet.</td></tr>';
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = '<div class="empty-state">No users registered yet.</div>';
      }
      return;
    }

    tbody.innerHTML = allUsers.map(u => {
      const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
      const roleBadgeClass = u.role === 'admin' ? 'badge-admin' : u.role === 'teacher' ? 'badge-teacher' : 'badge-parent';

      let linkedInfo = '<span style="color: var(--text-light);">-</span>';
      if (u.role === 'parent' && u.studentIds && u.studentIds.length) {
        linkedInfo = `<span class="badge" style="background: #ede9fe; color: #6d28d9;">Child: ${u.studentIds.join(', ')}</span>`;
      } else if (u.role === 'teacher' && u.teacherRef) {
        linkedInfo = `<span class="badge" style="background: #e0f2fe; color: #0284c7;">Faculty: ${u.teacherRef}</span>`;
      }

      return `
        <tr>
          <td>
            <div class="table-user-cell">
              <div class="table-avatar" style="display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; background: #1e3a8a;">
                ${initials}
              </div>
              <div class="table-user-info">
                <strong>${u.name}</strong>
                <small>${u.email}</small>
              </div>
            </div>
          </td>
          <td><strong style="font-family: monospace;">${u.username}</strong></td>
          <td><span class="user-role-badge ${roleBadgeClass}">${u.role}</span></td>
          <td>${u.phone || '<span style="color: var(--text-light);">-</span>'}</td>
          <td>${linkedInfo}</td>
          <td>
            <span class="badge ${u.status === 'active' ? 'badge-active' : 'badge-inactive'}">
              ${u.status}
            </span>
          </td>
          <td style="text-align: right;">
            ${u.username !== 'admin' ? `
              <button class="btn btn-outline btn-icon btn-sm" title="Toggle Status" onclick="toggleUserStatus('${u._id}', '${u.status}')">
                <i class="fa-solid fa-power-off" style="color: ${u.status === 'active' ? 'var(--warning)' : 'var(--success)'};"></i>
              </button>
              <button class="btn btn-outline btn-icon btn-sm" title="Delete User" onclick="deleteUser('${u._id}', '${u.username}')">
                <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
              </button>
            ` : '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Primary Admin</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Card Directory (<= 768px)
    if (mobileCardsContainer) {
      mobileCardsContainer.innerHTML = allUsers.map(u => {
        const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const roleBadgeClass = u.role === 'admin' ? 'badge-admin' : u.role === 'teacher' ? 'badge-teacher' : 'badge-parent';

        let linkedInfo = 'None';
        if (u.role === 'parent' && u.studentIds && u.studentIds.length) {
          linkedInfo = `Child ID: ${u.studentIds.join(', ')}`;
        } else if (u.role === 'teacher' && u.teacherRef) {
          linkedInfo = `Faculty Ref: ${u.teacherRef}`;
        }

        return `
          <div class="mobile-data-card">
            <div class="m-card-header">
              <div class="m-card-avatar" style="background: #1e3a8a;">
                ${initials}
              </div>
              <div class="m-card-title-box">
                <div class="m-card-name-row">
                  <h3 class="m-card-name">${u.name}</h3>
                  <span class="user-role-badge ${roleBadgeClass}">${u.role}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">
                  @${u.username}
                </div>
              </div>
            </div>

            <div class="m-card-details-grid">
              <div class="m-card-field">
                <span class="label">Email</span>
                <span class="value"><a href="mailto:${u.email}">${u.email}</a></span>
              </div>
              <div class="m-card-field">
                <span class="label">Phone</span>
                <span class="value">${u.phone || 'N/A'}</span>
              </div>
              <div class="m-card-field">
                <span class="label">Status</span>
                <span class="value"><span class="badge ${u.status === 'active' ? 'badge-active' : 'badge-inactive'}">${u.status}</span></span>
              </div>
              <div class="m-card-field">
                <span class="label">Linked Profile</span>
                <span class="value">${linkedInfo}</span>
              </div>
            </div>

            <div class="m-card-actions">
              ${u.username !== 'admin' ? `
                <button class="btn btn-outline btn-sm" onclick="toggleUserStatus('${u._id}', '${u.status}')">
                  <i class="fa-solid fa-power-off" style="color: ${u.status === 'active' ? 'var(--warning)' : 'var(--success)'};"></i>
                  ${u.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger-border);" onclick="deleteUser('${u._id}', '${u.username}')">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              ` : '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem;">System Primary Administrator</span>'}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

async function handleSaveUser(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-user');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

  const userData = {
    name: document.getElementById('form-user-name').value.trim(),
    email: document.getElementById('form-user-email').value.trim(),
    username: document.getElementById('form-user-username').value.trim(),
    password: document.getElementById('form-user-password').value,
    role: document.getElementById('form-user-role').value,
    phone: document.getElementById('form-user-phone').value.trim(),
    studentIds: document.getElementById('form-user-students').value.trim()
  };

  try {
    const res = await API.users.create(userData);
    Utils.showToast(res.message || 'User account created successfully!', 'success');
    Utils.closeModal('user-modal');
    await loadUsers();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to create user', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Create User';
  }
}

async function toggleUserStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  try {
    await API.users.update(id, { status: newStatus });
    Utils.showToast(`User status updated to ${newStatus}.`, 'info');
    await loadUsers();
  } catch (err) {
    Utils.showToast(err.message || 'Failed to update status', 'error');
  }
}

function deleteUser(id, username) {
  Utils.confirmAction({
    title: 'Delete User Account',
    message: `Are you sure you want to delete user account "${username}"? They will lose access to the portal.`,
    confirmText: 'Yes, Delete User',
    onConfirm: async () => {
      try {
        await API.users.delete(id);
        Utils.showToast(`User "${username}" deleted successfully!`, 'success');
        await loadUsers();
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete user', 'error');
      }
    }
  });
}

