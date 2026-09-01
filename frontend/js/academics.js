/**
 * academics.js
 * Academic records logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const contentDiv = document.getElementById('academicContent');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    const profile = await API.request('getStudentProfile');
    userBadge.innerText = `${profile.RegisterNo} | ${profile.Batch} | Sec ${profile.Section}`;

    const academicData = await API.request('getStudentAcademics');
    const records = academicData;

    if (records.length === 0) {
      contentDiv.innerHTML = `
        <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
          <p>No academic records available for your profile.</p>
        </div>
      `;
      return;
    }

    contentDiv.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Latest CGPA</div>
          <div class="value">${records[0].cgpa}</div>
        </div>
        <div class="stat-card">
          <div class="label">Latest SGPA</div>
          <div class="value">${records[0].sgpa}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Backlogs</div>
          <div class="value" style="color: ${records[0].backlogs > 0 ? 'var(--error)' : 'var(--success)'}">${records[0].backlogs}</div>
        </div>
        <div class="stat-card">
          <div class="label">Academic Status</div>
          <div class="value">${records[0].status}</div>
        </div>
      </div>

      <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow);">
        <h3 style="margin-bottom: 1.5rem;">Semester-wise Breakdown</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Year</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Semester</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">SGPA</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">CGPA</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Backlogs</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 1rem;">${r.year}</td>
                  <td style="padding: 1rem;">${r.semester}</td>
                  <td style="padding: 1rem; font-weight: 600;">${r.sgpa}</td>
                  <td style="padding: 1rem; font-weight: 600;">${r.cgpa}</td>
                  <td style="padding: 1rem; color: ${r.backlogs > 0 ? 'var(--error)' : 'var(--success)'}">${r.backlogs}</td>
                  <td style="padding: 1rem; font-size: 0.9rem; color: var(--text-muted);">${r.remarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
        <p style="color: var(--error); font-weight: 600;">${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
});
