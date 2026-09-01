/**
 * logs.js
 * Audit Log viewing logic for the Admin Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  if (Auth.getRole() !== 'ADMIN') {
    alert('Unauthorized access to audit logs');
    window.location.href = 'dashboard.html';
    return;
  }

  const tableBody = document.getElementById('logsTableBody');
  const filterAction = document.getElementById('filterAction');
  const filterBtn = document.getElementById('filterBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');

  logoutBtn.addEventListener('click', () => Auth.logout());

  async function loadLogs(actionFilter = '') {
    try {
      const payload = actionFilter ? { action: actionFilter } : {};
      const logs = await API.request('getAuditLogs', payload);

      if (logs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">No logs found matching criteria.</td></tr>`;
        return;
      }

      tableBody.innerHTML = logs.map(l => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 1rem; font-size: 0.85rem;">${l.Timestamp}</td>
          <td style="padding: 1rem; font-weight: 600;">${l.UserID}</td>
          <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">${l.Action}</td>
          <td style="padding: 1rem; font-size: 0.85rem;">${l.Module}</td>
          <td style="padding: 1rem;">
            <span style="padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${l.Result === 'SUCCESS' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)'}; color: ${l.Result === 'SUCCESS' ? 'var(--success)' : 'var(--error)'};">
              ${l.Result}
            </span>
          </td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted);">${l.Remarks}</td>
        </tr>
      `).join('');

    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--error);">${error.message}</td></tr>`;
    }
  }

  filterBtn.addEventListener('click', () => loadLogs(filterAction.value));

  await loadLogs();
});
