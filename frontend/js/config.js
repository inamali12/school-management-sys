/**
 * SchoolConnect - Frontend Runtime Configuration
 * Automatically detects local development vs production cloud deployment (Vercel / Render)
 */
const CONFIG = (() => {
  const isLocalDev = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

  // In production (Vercel, Render, custom domain), use relative path "" so /api/... routes natively.
  // In local development with separate dev servers (e.g., Live Server on 5500, 3000), target http://localhost:5000.
  let apiBase = '';
  if (isLocalDev && window.location.port && window.location.port !== '5000') {
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

