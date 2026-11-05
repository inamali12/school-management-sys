/**
 * SchoolConnect - Authentication & Role-Based UI Controller
 */

const Auth = (() => {
  // Check if current page is login page
  const isLoginPage = () => window.location.pathname.includes('login.html');

  // Verify Auth on protected pages
  function checkAuth() {
    const token = API.getToken();
    const user = API.getUser();

    if (!token || !user) {
      if (!isLoginPage()) {
        window.location.href = 'login.html';
      }
      return false;
    }

    if (isLoginPage()) {
      window.location.href = 'dashboard.html';
      return false;
    }

    return true;
  }

  // Populate User Profile Information in UI
  function renderUserProfile() {
    const user = API.getUser();
    if (!user) return;

    // Sidebar user details
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');

    if (sidebarUserName) sidebarUserName.innerText = user.name;
    if (sidebarUserRole) {
      sidebarUserRole.innerText = user.role.toUpperCase();
      sidebarUserRole.className = `user-role-badge badge-${user.role}`;
    }
    if (sidebarUserAvatar) {
      if (user.avatar) {
        sidebarUserAvatar.innerHTML = `<img src="${user.avatar}" class="table-avatar" alt="${user.name}">`;
      } else {
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        sidebarUserAvatar.innerText = initials;
      }
    }

    // Header user details
    const headerUserName = document.getElementById('header-user-name');
    if (headerUserName) headerUserName.innerText = user.name;

    // Apply Role-Based Navigation Filtering
    applyRolePermissions(user.role);
  }

  // Hide or show sidebar links based on user role
  function applyRolePermissions(role) {
    // Nav elements
    const navStudents = document.getElementById('nav-students');
    const navTeachers = document.getElementById('nav-teachers');
    const navClasses = document.getElementById('nav-classes');
    const navAttendance = document.getElementById('nav-attendance');
    const navFees = document.getElementById('nav-fees');
    const navReports = document.getElementById('nav-reports');
    const navUsers = document.getElementById('nav-users');

    if (role === 'teacher') {
      // Teachers cannot manage fees or users
      if (navFees) navFees.style.display = 'none';
      if (navUsers) navUsers.style.display = 'none';
      // Teachers can see their classes & attendance & students
    } else if (role === 'parent') {
      // Parents can view only their children, attendance, and fees
      if (navTeachers) navTeachers.style.display = 'none';
      if (navClasses) navClasses.style.display = 'none';
      if (navReports) navReports.style.display = 'none';
      if (navUsers) navUsers.style.display = 'none';
    }
  }

  // Handle Logout
  async function logout() {
    try {
      await API.auth.logout();
    } catch (err) {
      console.warn('Logout notice:', err);
    }
    Utils.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }

  // Auto-run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
      renderUserProfile();
      Utils.initSidebar();
      
      const logoutBtns = document.querySelectorAll('.btn-logout');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      });
    }
  });

  return {
    checkAuth,
    renderUserProfile,
    logout
  };
})();
