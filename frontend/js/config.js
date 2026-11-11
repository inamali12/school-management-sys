
/**
 * SchoolConnect - Frontend Runtime Configuration
 */

const CONFIG = (() => {
  const isFileProtocol = window.location.protocol === 'file:';

  const isLocalDevHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const RENDER_API_URL =
    'https://school-management-sys-n8wf.onrender.com';

  let apiBase = RENDER_API_URL;

  // Local development using separate Live Server
  if (isFileProtocol) {
    apiBase = 'http://localhost:5000';
  } else if (
    isLocalDevHost &&
    window.location.port &&
    window.location.port !== '5000'
  ) {
    apiBase = 'http://localhost:5000';
  } else if (
    isLocalDevHost &&
    window.location.port === '5000'
  ) {
    apiBase = '';
  }

  // Optional runtime override
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
