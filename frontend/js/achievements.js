/**
 * achievements.js
 * Achievement management logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const listDiv = document.getElementById('achievementsList');
  const submitBtn = document.getElementById('submitBtn');
  const modal = document.getElementById('submitModal');
  const closeModal = document.getElementById('closeModal');
  const form = document.getElementById('achievementForm');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  // Toggle Modal
  submitBtn.addEventListener('click', () => modal.style.display = 'flex');
  closeModal.addEventListener('click', () => modal.style.display = 'none');

  // Submit Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      Category: document.getElementById('category').value,
      EventName: document.getElementById('eventName').value,
      Organizer: document.getElementById('organizer').value,
      EventDate: document.getElementById('eventDate').value,
      Level: document.getElementById('level').value,
      Position: document.getElementById('position').value,
      Description: document.getElementById('description').value,
      ProofReference: document.getElementById('proof').value,
    };

    try {
      const res = await API.request('submitAchievement', payload);
      alert(res.message);
      form.reset();
      modal.style.display = 'none';
      await loadAchievements();
    } catch (error) {
      alert('Error submitting achievement: ' + error.message);
    }
  });

  async function loadAchievements() {
    try {
      const data = await API.request('getStudentAchievements');

      if (data.length === 0) {
        listDiv.innerHTML = `
          <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
            <p>No achievements found. Start by submitting your first one!</p>
            <button onclick="document.getElementById('submitBtn').click()" class="btn btn-primary" style="margin-top: 1rem;">Submit Now</button>
          </div>
        `;
        return;
      }

      listDiv.innerHTML = data.map(a => `
        <div class="stat-card" style="margin-bottom: 1rem; border-left-color: ${a.status === 'VERIFIED' ? 'var(--success)' : 'var(--accent-color)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${a.category} | ${a.level}</span>
              <h3 style="margin: 0.25rem 0;">${a.eventName}</h3>
              <p style="font-size: 0.9rem; color: var(--text-muted);">${a.organizer} | ${a.eventDate}</p>
            </div>
            <div style="text-align: right;">
              <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${a.status === 'VERIFIED' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(237, 137, 54, 0.1)'}; color: ${a.status === 'VERIFIED' ? 'var(--success)' : 'var(--accent-color)'};">
                ${a.status}
              </span>
              <div style="margin-top: 0.5rem; font-weight: 700; color: var(--primary-color);">${a.position}</div>
            </div>
          </div>
          <p style="margin-top: 1rem; font-size: 0.9rem;">${a.description}</p>
          ${a.proofReference ? `
            <div style="margin-top: 1rem; font-size: 0.8rem;">
              <a href="${a.proofReference}" target="_blank" style="color: var(--secondary-color); text-decoration: none; font-weight: 600;">View Proof $\rightarrow$</a>
            </div>
          ` : ''}
        </div>
      `).join('');

    } catch (error) {
      listDiv.innerHTML = `<p style="color: var(--error);">Error loading achievements: ${error.message}</p>`;
    }
  }

  await loadAchievements();
});
