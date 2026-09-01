/**
 * admin.js
 * Admin Dashboard Logic & Analytics
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  if (Auth.getRole() !== 'ADMIN') {
    alert('Unauthorized access to admin dashboard');
    window.location.href = 'dashboard.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    // 1. Fetch Overall Stats
    const stats = await API.request('getDashboardStats');

    // Update Summary Tiles
    document.getElementById('stat-total-students').innerText = stats.general.totalStudents;
    document.getElementById('stat-collection-rate').innerText = `${stats.finance.collectionRate}%`;
    document.getElementById('stat-pending-fees').innerText = `₹${stats.finance.totalPending.toLocaleString()}`;
    document.getElementById('stat-pending-verif').innerText =
      (stats.verifications.pendingAchievements + stats.verifications.pendingCertifications);

    // 2. Render Charts
    renderFinanceChart(stats.finance);
    renderFacilityChart(stats.facilities);

    // 3. Load Defaulters Table
    const defaulters = await API.request('getPendingFeesReport');
    const tableBody = document.getElementById('defaulterTableBody');

    // Sort by balance descending
    defaulters.sort((a, b) => b.balance - a.balance);

    tableBody.innerHTML = defaulters.slice(0, 10).map(d => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem;">${d.registerNo}</td>
        <td style="padding: 1rem;">${d.name}</td>
        <td style="padding: 1rem;">${d.batch}</td>
        <td style="padding: 1rem; color: var(--error); font-weight: 600;">₹${d.balance.toLocaleString()}</td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Admin Load Error:', error);
    document.getElementById('adminDashboard').innerHTML = `
      <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
        <p style="color: var(--error); font-weight: 600;">${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
});

function renderFinanceChart(financeData) {
  const ctx = document.getElementById('financeChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Collected', 'Pending'],
      datasets: [{
        data: [financeData.totalCollected, financeData.totalPending],
        backgroundColor: ['#48bb78', '#f56565'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderFacilityChart(facilityData) {
  const ctx = document.getElementById('facilityChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Hostellers', 'Day Scholars', 'Bus Users'],
      datasets: [{
        label: 'Student Count',
        data: [facilityData.hostellers, facilityData.dayScholars, facilityData.busUsers],
        backgroundColor: '#2b6cb0',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}
