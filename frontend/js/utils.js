/**
 * SchoolConnect - Utility Helper Functions
 * Toast alerts, CSV Export, Currency & Date formatters, Modal helpers
 */

const Utils = (() => {
  // Ensure toast container exists
  function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Toast Notification System
  function showToast(message, type = 'info', duration = 4000) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Format currency into Pakistani Rupees (PKR)
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return 'Rs. ' + num.toLocaleString('en-PK');
  }

  // Format date to readable format (e.g. 05 Nov 2025)
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // Export array of JSON objects to CSV file
  function exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      showToast('No data available to export', 'warning');
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date
            ? cell.toLocaleString()
            : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${filename}.csv successfully!`, 'success');
    }
  }

  // Modal Dialog Handlers
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Reusable Confirmation Dialog
  function confirmAction({ title, message, confirmText = 'Yes, Delete', onConfirm }) {
    let confirmModal = document.getElementById('global-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'global-confirm-modal';
      confirmModal.className = 'modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3 id="confirm-modal-title" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Confirm Action</h3>
            <button class="modal-close-btn" onclick="Utils.closeModal('global-confirm-modal')"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" style="color: #475569; font-size: 0.92rem;"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" onclick="Utils.closeModal('global-confirm-modal')">Cancel</button>
            <button class="btn btn-danger btn-sm" id="confirm-modal-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirm-modal-title').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${title || 'Confirm Action'}`;
    document.getElementById('confirm-modal-message').innerText = message || 'Are you sure you want to proceed?';
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.innerText = confirmText;
    confirmBtn.onclick = () => {
      closeModal('global-confirm-modal');
      if (typeof onConfirm === 'function') onConfirm();
    };

    openModal('global-confirm-modal');
  }

  // Mobile Sidebar Toggle Initialization
  function initSidebar() {
    const toggleBtn = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 &&
            !sidebar.contains(e.target) &&
            !toggleBtn.contains(e.target) &&
            sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  // Print voucher or element
  function printElement(elementId, title = 'SchoolConnect Document') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="css/style.css">
        <link rel="stylesheet" href="css/components.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          body { padding: 20px; background: white; color: black; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return {
    showToast,
    formatCurrency,
    formatDate,
    exportToCSV,
    openModal,
    closeModal,
    confirmAction,
    initSidebar,
    printElement
  };
})();

