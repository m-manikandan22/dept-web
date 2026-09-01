/**
 * fees.js
 * Fee Management logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Authentication Check
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const totalFeeEl = document.getElementById('totalFee');
  const totalPaidEl = document.getElementById('totalPaid');
  const totalPendingEl = document.getElementById('totalPending');
  const feeBreakdownBody = document.getElementById('feeBreakdownBody');
  const paymentHistoryBody = document.getElementById('paymentHistoryBody');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    // 2. Fetch User Profile for the badge
    const profile = await API.request('getStudentProfile');
    userBadge.innerText = `${profile.RegisterNo} | ${profile.Batch} | Sec ${profile.Section}`;

    // 3. Fetch Fees Data
    const feeData = await API.request('getStudentFees');
    const { totals, summary } = feeData;

    // Update Summary Cards
    totalFeeEl.innerText = `₹${totals.total.toLocaleString()}`;
    totalPaidEl.innerText = `₹${totals.paid.toLocaleString()}`;
    totalPendingEl.innerText = `₹${totals.pending.toLocaleString()}`;

    // Update Breakdown Table
    feeBreakdownBody.innerHTML = summary.map(fee => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem;">${fee.type}</td>
        <td style="padding: 1rem;">₹${fee.total.toLocaleString()}</td>
        <td style="padding: 1rem; color: var(--success);">₹${fee.paid.toLocaleString()}</td>
        <td style="padding: 1rem; color: var(--error);">₹${fee.pending.toLocaleString()}</td>
        <td style="padding: 1rem;">${fee.dueDate}</td>
      </tr>
    `).join('');

    // 4. Fetch Payment History
    const paymentData = await API.request('getStudentPayments');
    const payments = paymentData;

    paymentHistoryBody.innerHTML = payments.map(p => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem;">${p.date}</td>
        <td style="padding: 1rem; font-weight: 600;">₹${p.amount.toLocaleString()}</td>
        <td style="padding: 1rem;">${p.mode}</td>
        <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">${p.reference}</td>
      </tr>
    `).join('');

  } catch (error) {
    document.getElementById('feesDashboard').innerHTML = `
      <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
        <p style="color: var(--error); font-weight: 600;">${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
});
