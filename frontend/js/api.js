/**
 * SchoolConnect - Centralized API Service Client
 * Handles HTTP requests, JWT token authentication, and API endpoints
 */

const API = (() => {
  const BASE_URL = window.location.origin;

  const getToken = () => localStorage.getItem('schoolconnect_token');
  const setToken = (token) => localStorage.setItem('schoolconnect_token', token);
  const removeToken = () => {
    localStorage.removeItem('schoolconnect_token');
    localStorage.removeItem('schoolconnect_user');
  };

  const getUser = () => {
    const raw = localStorage.getItem('schoolconnect_user');
    return raw ? JSON.parse(raw) : null;
  };

  const setUser = (user) => {
    localStorage.setItem('schoolconnect_user', JSON.stringify(user));
  };

  // Base HTTP Request Helper
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}/api${endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        removeToken();
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = 'login.html?session=expired';
        }
        throw new Error('Your session has expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unexpected error occurred');
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,

    // Authentication Endpoints
    auth: {
      login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
      getMe: () => request('/auth/me'),
      changePassword: (data) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
      logout: () => {
        removeToken();
        return Promise.resolve({ success: true });
      }
    },

    // Student Management Endpoints
    students: {
      getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/students?${query}`);
      },
      getById: (id) => request(`/students/${id}`),
      getNextId: () => request('/students/generate/next-id'),
      create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/students/${id}`, { method: 'DELETE' })
    },

    // Teacher Management Endpoints
    teachers: {
      getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/teachers?${query}`);
      },
      getById: (id) => request(`/teachers/${id}`),
      getNextId: () => request('/teachers/generate/next-id'),
      create: (data) => request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/teachers/${id}`, { method: 'DELETE' })
    },

    // Class Management Endpoints
    classes: {
      getAll: () => request('/classes'),
      getById: (id) => request(`/classes/${id}`),
      create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/classes/${id}`, { method: 'DELETE' })
    },

    // Attendance Management Endpoints
    attendance: {
      getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/attendance?${query}`);
      },
      getStats: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/attendance/stats?${query}`);
      },
      mark: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
      markBulk: (data) => request('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/attendance/${id}`, { method: 'DELETE' })
    },

    // Fee Management Endpoints
    fees: {
      getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/fees?${query}`);
      },
      getById: (id) => request(`/fees/${id}`),
      getNextId: () => request('/fees/generate/next-id'),
      create: (data) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
      generateBulk: (data) => request('/fees/bulk-generate', { method: 'POST', body: JSON.stringify(data) }),
      recordPayment: (id, data) => request(`/fees/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/fees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/fees/${id}`, { method: 'DELETE' }),
      getStats: () => request('/fees/stats/summary')
    },

    // Dashboard Analytics Endpoints
    dashboard: {
      getStats: () => request('/dashboard/stats')
    },

    // Reports Endpoints
    reports: {
      getStudents: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/students?${query}`);
      },
      getDailyAttendance: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/attendance-daily?${query}`);
      },
      getMonthlyAttendance: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/attendance-monthly?${query}`);
      },
      getFeeCollection: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/fees-collection?${query}`);
      },
      getFeeDefaulters: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/fees-defaulters?${query}`);
      },
      getTeachers: () => request('/reports/teachers')
    },

    // User Management Endpoints
    users: {
      getAll: () => request('/users'),
      create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/users/${id}`, { method: 'DELETE' })
    }
  };
})();
