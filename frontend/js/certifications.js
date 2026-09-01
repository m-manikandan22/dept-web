/**
 * certifications.js
 * Certification management logic for the Student Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const listDiv = document.getElementById('certsList');
  const submitBtn = document.getElementById('submitBtn');
  const modal = document.getElementById('submitModal');
  const closeModal = document.getElementById('closeModal');
  const form = document.getElementById('certForm');
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', () => Auth.logout());

  // Toggle Modal
  submitBtn.addEventListener('click', () => modal.style.display = 'flex');
  closeModal.addEventListener('click', () => modal.style.display = 'none');

  // Submit Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      CourseName: document.getElementById('courseName').value,
      Platform: document.getElementById('platform').value,
      CompletionDate: document.getElementById('completionDate').value,
      Score: document.getElementById('score').value,
      CertificateURL: document.getElementById('certUrl').value,
      ProofReference: document.getElementById('proof').value,
    };

    try {
      const res = await API.request('submitCertification', payload);
      alert(res.message);
      form.reset();
      modal.style.display = 'none';
      await loadCertifications();
    } catch (error) {
      alert('Error submitting certification: ' + error.message);
    }
  });

  async function loadCertifications() {
    try {
      const data = await API.request('getStudentCertifications');

      if (data.length === 0) {
        listDiv.innerHTML = `
          <div class="flex-center" style="height: 60vh; flex-direction: column; text-align: center;">
            <p>No certifications found. Show off your learning!</p>
            <button onclick="document.getElementById('submitBtn').click()" class="btn btn-primary" style="margin-top: 1rem;">Submit Now</button>
          </div>
        `;
        return;
      }

      listDiv.innerHTML = data.map(c => `
        <div class="stat-card" style="margin-bottom: 1rem; border-left-color: ${c.status === 'VERIFIED' ? 'var(--success)' : 'var(--accent-color)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${c.platform}</span>
              <h3 style="margin: 0.25rem 0;">${c.courseName}</h3>
              <p style="font-size: 0.9rem; color: var(--text-muted);">Completed: ${c.completionDate}</p>
            </div>
            <div style="text-align: right;">
              <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: ${c.status === 'VERIFIED' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(237, 137, 54, 0.1)'}; color: ${c.status === 'VERIFIED' ? 'var(--success)' : 'var(--accent-color)'};">
                ${c.status}
              </span>
              <div style="margin-top: 0.5rem; font-weight: 700; color: var(--primary-color);">${c.score}</div>
            </div>
          </div>
          ${c.certificateUrl ? `
            <div style="margin-top: 1rem; font-size: 0.8rem;">
              <a href="${c.certificateUrl}" target="_blank" style="color: var(--secondary-color); text-decoration: none; font-weight: 600;">View Certificate $\rightarrow$</a>
            </div>
          ` : ''}
        </div>
      `).join('');

    } catch (error) {
      listDiv.innerHTML = `<p style="color: var(--error);">Error loading certifications: ${error.message}</p>`;
    }
  }

  await loadCertifications();
});
