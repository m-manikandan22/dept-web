/**
 * transport.js
 * Transport information logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const contentDiv = document.getElementById('transportContent');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    const profile = await API.request('getStudentProfile');
    userBadge.innerText = `${profile.RegisterNo} | ${profile.Batch} | Sec ${profile.Section}`;

    const transport = await API.request('getStudentTransport');

    if (!transport.UsesCollegeBus) {
      contentDiv.innerHTML = `
        <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚌</div>
          <h3>You are not using the college bus service</h3>
          <p style="color: var(--text-muted);">No transport records are assigned to your profile.</p>
        </div>
      `;
    } else {
      contentDiv.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card">
            <div class="label">Route Name</div>
            <div class="value">${transport.Route}</div>
          </div>
          <div class="stat-card">
            <div class="label">Bus Number</div>
            <div class="value">${transport.BusNumber}</div>
          </div>
          <div class="stat-card">
            <div class="label">Transport Fee</div>
            <div class="value">₹${Number(transport.TransportFee).toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="label">Status</div>
            <div class="value">${transport.Status}</div>
          </div>
        </div>

        <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow);">
          <h3>Transit Details</h3>
          <p style="margin-top: 1rem;"><strong>Service Status:</strong> ${transport.Status}</p>
          <p><strong>Bus Assignment:</strong> Validated</p>
        </div>
      `;
    }
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
        <p style="color: var(--error); font-weight: 600;">${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
});
