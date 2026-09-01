/**
 * hostel.js
 * Hostel information logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const contentDiv = document.getElementById('hostelContent');
  const userBadge = document.getElementById('userBadge');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    const profile = await API.request('getStudentProfile');
    userBadge.innerText = `${profile.RegisterNo} | ${profile.Batch} | Sec ${profile.Section}`;

    const hostel = await API.request('getStudentHostel');

    if (hostel.AccommodationType === 'Day Scholar') {
      contentDiv.innerHTML = `
        <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏠</div>
          <h3>You are registered as a Day Scholar</h3>
          <p style="color: var(--text-muted);">No hostel accommodation is assigned to your profile.</p>
        </div>
      `;
    } else {
      contentDiv.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card">
            <div class="label">Hostel Name</div>
            <div class="value">${hostel.HostelName}</div>
          </div>
          <div class="stat-card">
            <div class="label">Room Number</div>
            <div class="value">${hostel.RoomNumber}</div>
          </div>
          <div class="stat-card">
            <div class="label">Hostel Fee</div>
            <div class="value">₹${Number(hostel.HostelFee).toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="label">Mess Fee</div>
            <div class="value">₹${Number(hostel.MessFee).toLocaleString()}</div>
          </div>
        </div>

        <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow);">
          <h3>Accommodation Details</h3>
          <p style="margin-top: 1rem;"><strong>Status:</strong> ${hostel.Status}</p>
          <p><strong>Type:</strong> ${hostel.AccommodationType}</p>
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
