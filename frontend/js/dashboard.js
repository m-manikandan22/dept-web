/**
 * dashboard.js
 * Student Dashboard Logic (Version 2.0)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const welcomeText = document.getElementById('welcomeText');
  const userBadge = document.getElementById('userBadge');
  const contentDiv = document.getElementById('dashboardContent');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  try {
    // 1. Check if onboarding is completed
    const onboardStatus = await API.request('checkOnboarding');

    if (!onboardStatus.isCompleted) {
      window.location.href = 'onboarding.html';
      return;
    }

    // 2. Fetch Student Profile
    const profile = await API.request('getStudentProfile');

    welcomeText.innerText = `Welcome, ${profile.Name}`;
    userBadge.innerText = `${profile.RegisterNo} | ${profile.Batch} | Sec ${profile.Section}`;

    // 3. Fetch Fee Summary
    const feeData = await API.request('getStudentFees');
    const { totals } = feeData;

    // 4. Render Dashboard
    contentDiv.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Total Fee</div>
          <div class="value">₹${totals.total.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Paid Amount</div>
          <div class="value" style="color: var(--success);">₹${totals.paid.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label, label-pending">Pending Balance</div>
          <div class="value" style="color: var(--error);">₹${totals.pending.toLocaleString()}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem;">
        <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow);">
          <h3 style="margin-bottom: 1rem;">Quick Info</h3>
          <p><strong>Email:</strong> ${profile.Email}</p>
          <p><strong>Phone:</strong> ${profile.Phone}</p>
          <p><strong>Batch:</strong> ${profile.Batch}</p>
          <p><strong>Section:</strong> ${profile.Section}</p>
        </div>
        <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow);">
          <h3 style="margin-bottom: 1rem;">Fee Status</h3>
          <p>Your current pending balance is <strong>₹${totals.pending.toLocaleString()}</strong>.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem;">
            Please navigate to the "Fees & Payments" section to make a payment.
          </p>
          <a href="fees.html" class="btn btn-primary" style="display: inline-block; margin-top: 1rem; text-decoration: none; font-size: 0.9rem;">View Details</a>
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
