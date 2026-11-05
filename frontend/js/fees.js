/**
 * SchoolConnect - Fee Management Controller
 * Monthly generation, Bulk Class Generation, Partial & Full Payments, Printable Vouchers
 */

let allFees = [];
let allStudentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadFees(), loadFeeStats(), loadStudentsDropdown()]);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'generate') {
    openCreateFeeModal();
  }

  // Listeners
  document.getElementById('btn-open-create-fee').addEventListener('click', openCreateFeeModal);
  document.getElementById('btn-open-bulk-fee').addEventListener('click', () => Utils.openModal('bulk-fee-modal'));
  document.getElementById('create-fee-form').addEventListener('submit', handleCreateFee);
  document.getElementById('bulk-fee-form').addEventListener('submit', handleBulkFee);
  document.getElementById('payment-form').addEventListener('submit', handleRecordPayment);

  // Filters
  const searchInput = document.getElementById('search-fees');
  const monthFilter = document.getElementById('filter-fee-month');
  const classFilter = document.getElementById('filter-fee-class');
  const statusFilter = document.getElementById('filter-fee-status');
  const resetBtn = document.getElementById('btn-reset-fee-filters');
  const exportBtn = document.getElementById('btn-export-fees');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadFees, 300);
  });
  monthFilter.addEventListener('change', loadFees);
  classFilter.addEventListener('change', loadFees);
  statusFilter.addEventListener('change', loadFees);

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    monthFilter.value = 'all';
    classFilter.value = 'all';
    statusFilter.value = 'all';
    loadFees();
  });

  exportBtn.addEventListener('click', () => {
    const exportData = allFees.map(f => ({
      'Voucher ID': f.feeId,
      'Student ID': f.studentId,
      'Student Name': f.studentName,
      'Class': f.className,
      'Section': f.section,
      'Month': f.month,
      'Tuition Fee': f.tuitionFee,
      'Exam Fee': f.examFee,
      'Other Charges': f.otherCharges,
      'Discount': f.discount,
      'Total Fee': f.totalFee,
      'Paid Amount': f.paidAmount,
      'Remaining Balance': f.remainingBalance,
      'Due Date': f.dueDate,
      'Status': f.paymentStatus
    }));
    Utils.exportToCSV('Fee_Vouchers_Directory', exportData);
  });

  // Student selection changes default tuition fee
  document.getElementById('form-fee-student').addEventListener('change', (e) => {
    const student = allStudentsList.find(s => s.studentId === e.target.value);
    if (student) {
      document.getElementById('form-fee-tuition').value = student.monthlyTuitionFee || 3500;
    }
  });

  // Full payment button in payment modal
  document.getElementById('btn-pay-full').addEventListener('click', () => {
    const balanceText = document.getElementById('pay-remaining-balance').innerText;
    const cleanNum = balanceText.replace(/[^0-9]/g, '');
    document.getElementById('pay-amount').value = cleanNum;
  });
});

async function loadFeeStats() {
  try {
    const res = await API.fees.getStats();
    const stats = res.data;
    document.getElementById('fee-total-collected').innerText = Utils.formatCurrency(stats.totalCollected);
    document.getElementById('fee-paid-count').innerText = `${stats.paidCount} Vouchers fully paid`;
    document.getElementById('fee-total-pending').innerText = Utils.formatCurrency(stats.totalPending);
    document.getElementById('fee-pending-count').innerText = `${stats.pendingCount + stats.partialCount + stats.overdueCount} Unsettled vouchers`;
    document.getElementById('fee-partial-count').innerText = stats.partialCount;
    document.getElementById('fee-vouchers-count').innerText = stats.totalFeesCount;
  } catch (err) {
    console.warn('Fee stats notice:', err);
  }
}

async function loadStudentsDropdown() {
  try {
    const res = await API.students.getAll({ status: 'Active' });
    allStudentsList = res.data || [];
    const select = document.getElementById('form-fee-student');
    select.innerHTML = '<option value="">Choose a student...</option>' +
      allStudentsList.map(s => `<option value="${s.studentId}">${s.fullName} (${s.studentId} - ${s.className})</option>`).join('');
  } catch (err) {
    console.warn('Students dropdown note:', err);
  }
}

async function loadFees() {
  const tbody = document.getElementById('fees-tbody');
  const countBadge = document.getElementById('fee-count-badge');

  const search = document.getElementById('search-fees').value.trim();
  const month = document.getElementById('filter-fee-month').value;
  const className = document.getElementById('filter-fee-class').value;
  const paymentStatus = document.getElementById('filter-fee-status').value;

  tbody.innerHTML = '<tr><td colspan="10"><div class="spinner"></div></td></tr>';

  try {
    const response = await API.fees.getAll({
      search,
      month: month !== 'all' ? month : undefined,
      className: className !== 'all' ? className : undefined,
      paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined
    });

    allFees = response.data || [];
    countBadge.innerText = `Showing ${allFees.length} voucher(s)`;

    if (allFees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No fee vouchers match your filters.</td></tr>';
      return;
    }

    const currentUser = API.getUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    tbody.innerHTML = allFees.map(fee => `
      <tr>
        <td><strong style="color: var(--primary); font-family: monospace;">${fee.feeId}</strong></td>
        <td>
          <div class="table-user-info">
            <strong>${fee.studentName}</strong>
            <small>${fee.studentId}</small>
          </div>
        </td>
        <td><span class="badge" style="background: #e0f2fe; color: #0284c7;">${fee.className}-${fee.section}</span></td>
        <td><strong>${fee.month}</strong></td>
        <td>${Utils.formatCurrency(fee.totalFee)}</td>
        <td><strong style="color: var(--success);">${Utils.formatCurrency(fee.paidAmount)}</strong></td>
        <td><strong style="color: var(--danger);">${Utils.formatCurrency(fee.remainingBalance)}</strong></td>
        <td><small>${Utils.formatDate(fee.dueDate)}</small></td>
        <td>
          <span class="badge ${fee.paymentStatus === 'Paid' ? 'badge-paid' : fee.paymentStatus === 'Partial' ? 'badge-partial' : fee.paymentStatus === 'Overdue' ? 'badge-overdue' : 'badge-pending'}">
            ${fee.paymentStatus}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          ${isAdmin && fee.remainingBalance > 0 ? `
            <button class="btn btn-success btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" title="Collect Payment" onclick="openPaymentModal('${fee._id}')">
              <i class="fa-solid fa-hand-holding-dollar"></i> Pay
            </button>
          ` : ''}
          <button class="btn btn-outline btn-icon btn-sm" title="Print Fee Voucher" onclick="viewPrintVoucher('${fee._id}')">
            <i class="fa-solid fa-receipt" style="color: var(--primary);"></i>
          </button>
          ${isAdmin ? `
            <button class="btn btn-outline btn-icon btn-sm" title="Delete Voucher" onclick="deleteFeeVoucher('${fee._id}', '${fee.feeId}', '${fee.studentName}')">
              <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
  }
}

function openCreateFeeModal() {
  document.getElementById('create-fee-form').reset();
  document.getElementById('form-fee-due-date').value = '2025-11-10';
  Utils.openModal('create-fee-modal');
}

async function handleCreateFee(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-fee');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

  const feeData = {
    studentId: document.getElementById('form-fee-student').value,
    month: document.getElementById('form-fee-month').value,
    dueDate: document.getElementById('form-fee-due-date').value,
    tuitionFee: Number(document.getElementById('form-fee-tuition').value),
    examFee: Number(document.getElementById('form-fee-exam').value) || 0,
    otherCharges: Number(document.getElementById('form-fee-other').value) || 0,
    discount: Number(document.getElementById('form-fee-discount').value) || 0
  };

  try {
    const res = await API.fees.create(feeData);
    Utils.showToast(res.message || 'Fee voucher generated successfully!', 'success');
    Utils.closeModal('create-fee-modal');
    await Promise.all([loadFees(), loadFeeStats()]);
  } catch (err) {
    Utils.showToast(err.message || 'Failed to generate fee voucher', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-receipt"></i> Generate Voucher';
  }
}

async function handleBulkFee(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-bulk-fee');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Class...';

  const bulkData = {
    className: document.getElementById('bulk-class-name').value,
    section: document.getElementById('bulk-class-section').value,
    month: document.getElementById('bulk-month').value,
    dueDate: document.getElementById('bulk-due-date').value,
    examFee: Number(document.getElementById('bulk-exam-fee').value) || 0,
    otherCharges: Number(document.getElementById('bulk-other-charges').value) || 0
  };

  try {
    const res = await API.fees.generateBulk(bulkData);
    Utils.showToast(res.message, 'success');
    Utils.closeModal('bulk-fee-modal');
    await Promise.all([loadFees(), loadFeeStats()]);
  } catch (err) {
    Utils.showToast(err.message || 'Bulk generation failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Generate Class Vouchers';
  }
}

function openPaymentModal(id) {
  const fee = allFees.find(f => f._id === id);
  if (!fee) return;

  document.getElementById('pay-fee-id').value = fee._id;
  document.getElementById('pay-voucher-id').innerText = fee.feeId;
  document.getElementById('pay-student-name').innerText = `${fee.studentName} (${fee.className}-${fee.section})`;
  document.getElementById('pay-remaining-balance').innerText = Utils.formatCurrency(fee.remainingBalance);
  document.getElementById('pay-amount').value = fee.remainingBalance;
  document.getElementById('pay-notes').value = '';

  Utils.openModal('payment-modal');
}

async function handleRecordPayment(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-payment');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Recording...';

  const id = document.getElementById('pay-fee-id').value;
  const paymentPayload = {
    amount: Number(document.getElementById('pay-amount').value),
    paymentMethod: document.getElementById('pay-method').value,
    notes: document.getElementById('pay-notes').value.trim()
  };

  try {
    const res = await API.fees.recordPayment(id, paymentPayload);
    Utils.showToast(res.message, 'success');
    Utils.closeModal('payment-modal');
    await Promise.all([loadFees(), loadFeeStats()]);
  } catch (err) {
    Utils.showToast(err.message || 'Payment recording failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Confirm Payment';
  }
}

async function viewPrintVoucher(id) {
  const area = document.getElementById('voucher-printable-area');
  area.innerHTML = '<div class="spinner"></div>';
  Utils.openModal('voucher-view-modal');

  try {
    const res = await API.fees.getById(id);
    const f = res.data;
    const stu = f.studentDetails || {};

    const stampClass = f.paymentStatus.toLowerCase();

    area.innerHTML = `
      <div class="voucher-container" id="printable-voucher-element">
        <div class="voucher-header">
          <h2>Bright Future Public School</h2>
          <p>Station Road, Khairpur Mir's, Sindh, Pakistan &bull; Phone: 0243-551234</p>
          <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">Official Fee Challan / Receipt &bull; Academic Year: ${f.academicYear || '2025-2026'}</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">VOUCHER NO:</span>
            <strong style="font-size: 1.15rem; color: var(--primary); font-family: monospace; margin-left: 0.35rem;">${f.feeId}</strong>
          </div>
          <div>
            <span class="voucher-stamp ${stampClass}">${f.paymentStatus}</span>
          </div>
        </div>

        <div class="voucher-meta-grid">
          <div><strong>Student Name:</strong> ${f.studentName}</div>
          <div><strong>Student ID:</strong> ${f.studentId}</div>
          <div><strong>Father's Name:</strong> ${stu.fatherName || 'On Record'}</div>
          <div><strong>Class & Section:</strong> ${f.className} - ${f.section}</div>
          <div><strong>Billing Month:</strong> <span style="color: var(--primary); font-weight: 700;">${f.month}</span></div>
          <div><strong>Due Date:</strong> ${Utils.formatDate(f.dueDate)}</div>
        </div>

        <table class="voucher-table">
          <thead>
            <tr>
              <th>Fee Description</th>
              <th style="text-align: right;">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Tuition Fee</td>
              <td style="text-align: right;">${Utils.formatCurrency(f.tuitionFee)}</td>
            </tr>
            ${f.examFee ? `<tr><td>Examination & Assessment Fee</td><td style="text-align: right;">${Utils.formatCurrency(f.examFee)}</td></tr>` : ''}
            ${f.otherCharges ? `<tr><td>Library & Lab Charges</td><td style="text-align: right;">${Utils.formatCurrency(f.otherCharges)}</td></tr>` : ''}
            ${f.discount ? `<tr><td style="color: var(--success);">Scholarship / Fee Concession</td><td style="text-align: right; color: var(--success);">- ${Utils.formatCurrency(f.discount)}</td></tr>` : ''}
            <tr class="voucher-total-row">
              <td>Net Payable Fee</td>
              <td style="text-align: right; font-size: 1.05rem; color: var(--primary);">${Utils.formatCurrency(f.totalFee)}</td>
            </tr>
            <tr>
              <td>Paid Amount</td>
              <td style="text-align: right; font-weight: 700; color: var(--success);">${Utils.formatCurrency(f.paidAmount)}</td>
            </tr>
            <tr style="background: #fef2f2; font-weight: 800;">
              <td>Remaining Balance Dues</td>
              <td style="text-align: right; color: var(--danger); font-size: 1.1rem;">${Utils.formatCurrency(f.remainingBalance)}</td>
            </tr>
          </tbody>
        </table>

        ${f.payments && f.payments.length ? `
          <div style="margin-bottom: 1.5rem; background: #f0fdf4; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem;">
            <strong>Payment Transaction Log:</strong>
            ${f.payments.map(p => `
              <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                <span>Receipt #${p.receiptNo} &bull; ${p.paymentMethod} &bull; ${Utils.formatDate(p.paymentDate)}</span>
                <strong style="color: var(--success);">${Utils.formatCurrency(p.amount)}</strong>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 2.5rem; font-size: 0.8rem; color: #64748b;">
          <div style="text-align: center; border-top: 1px solid #94a3b8; width: 160px; padding-top: 0.4rem;">
            Depositor Signature
          </div>
          <div style="text-align: center; border-top: 1px solid #94a3b8; width: 160px; padding-top: 0.4rem;">
            Accountant / Cashier Stamp
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    area.innerHTML = `<div class="empty-state" style="color: var(--danger);">${err.message}</div>`;
  }
}

function deleteFeeVoucher(id, voucherNo, studentName) {
  Utils.confirmAction({
    title: 'Delete Fee Voucher',
    message: `Are you sure you want to delete voucher "${voucherNo}" for ${studentName}? This action cannot be undone.`,
    confirmText: 'Yes, Delete Voucher',
    onConfirm: async () => {
      try {
        await API.fees.delete(id);
        Utils.showToast(`Voucher "${voucherNo}" deleted successfully!`, 'success');
        await Promise.all([loadFees(), loadFeeStats()]);
      } catch (err) {
        Utils.showToast(err.message || 'Failed to delete fee voucher', 'error');
      }
    }
  });
}

