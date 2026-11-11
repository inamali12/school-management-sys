/**
 * SchoolConnect - Frontend Runtime Configuration
 * Automatically detects local development vs production cloud deployment (Vercel / Render)
 */
const CONFIG = (() => {
  const isFileProtocol = window.location.protocol === 'file:';
  const isLocalDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Base API URL Resolution:
  // 1. If opened directly via file:// (double-clicking HTML or start command), route to local backend on 5000
  // 2. If running via a separate dev server (e.g. VS Code Live Server on port 5500, 3000), route to port 5000
  // 3. If running on port 5000 directly or deployed in production (Vercel, Render), use relative path ""
  let apiBase = '';
  if (isFileProtocol) {
    apiBase = 'http://localhost:5000';
  } else if (isLocalDevHost && window.location.port && window.location.port !== '5000') {
    apiBase = 'http://localhost:5000';
  } else {
    apiBase = '';
  }

  // Allow optional runtime override via window.APP_CONFIG
  if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    apiBase = window.APP_CONFIG.API_URL;
  }

  return {
    API_BASE_URL: apiBase,
    APP_NAME: 'SchoolConnect',
    VERSION: '1.0.0',
    CURRENCY: 'Rs. ',
    DEFAULT_ACADEMIC_YEAR: '2025-2026'
  };
})();

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

