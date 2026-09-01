/**
 * staff.js
 * Integrated Staff Hub Logic (Version 2.0)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  // Role Check
  const role = Auth.getRole();
  if (role !== 'STAFF' && role !== 'ADMIN') {
    alert('Unauthorized access to staff hub');
    window.location.href = 'dashboard.html';
    return;
  }

  // DOM Elements - Navigation
  const navStudents = document.getElementById('nav-students');
  const navVerif = document.getElementById('nav-verif');
  const sectionStudents = document.getElementById('section-students');
  const sectionVerif = document.getElementById('section-verif');
  const pageTitle = document.getElementById('pageTitle');
  const logoutBtn = document.getElementById('logoutBtn');

  // DOM Elements - Student Management
  const studentTableBody = document.getElementById('studentTableBody');
  const searchInput = document.getElementById('searchStudent');
  const filterBatch = document.getElementById('filterBatch');
  const filterSection = document.getElementById('filterSection');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const btnAddStudent = document.getElementById('btnAddStudent');
  const btnBulkImport = document.getElementById('btnBulkImport');

  // Modals
  const addStudentModal = document.getElementById('addStudentModal');
  const closeAddModal = document.getElementById('closeAddModal');
  const addStudentForm = document.getElementById('addStudentForm');

  const bulkImportModal = document.getElementById('bulkImportModal');
  const closeBulkModal = document.getElementById('closeBulkModal');
  const processBulkBtn = document.getElementById('processBulkBtn');
  const csvFileInput = document.getElementById('csvFile');

  // Verification elements
  const tabAch = document.getElementById('tabAch');
  const tabCert = document.getElementById('tabCert');
  const queueContent = document.getElementById('queueContent');
  const verifyModal = document.getElementById('verifyModal');
  const closeVerifyModal = document.getElementById('closeVerifyModal');
  const recordDetails = document.getElementById('recordDetails');
  const remarksInput = document.getElementById('remarks');
  const verifyBtn = document.getElementById('verifyBtn');
  const rejectBtn = document.getElementById('rejectBtn');

  let currentVerifType = 'ACH'; // 'ACH' or 'CERT'
  let selectedRecordId = null;

  logoutBtn.addEventListener('click', () => Auth.logout());

  // --- NAVIGATION ---
  navStudents.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('students');
  });

  navVerif.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('verif');
  });

  function showSection(section) {
    if (section === 'students') {
      sectionStudents.style.display = 'block';
      sectionVerif.style.display = 'none';
      navStudents.classList.add('active');
      navVerif.classList.remove('active');
      pageTitle.innerText = 'Student Management';
      loadStudents();
    } else {
      sectionStudents.style.display = 'none';
      sectionVerif.style.display = 'block';
      navVerif.classList.add('active');
      navStudents.classList.remove('active');
      pageTitle.innerText = 'Verification Queue';
      loadQueue();
    }
  }

  // --- STUDENT MANAGEMENT ---
  async function loadStudents() {
    studentTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading students...</td></tr>';
    try {
      const payload = {
        search: searchInput.value,
        batch: filterBatch.value,
        section: filterSection.value
      };
      const students = await API.request('getStudents', payload);

      if (students.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No students found.</td></tr>';
        return;
      }

      studentTableBody.innerHTML = students.map(s => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 1rem; font-weight: 600;">${s.RegisterNo}</td>
          <td style="padding: 1rem;">${s.Name}</td>
          <td style="padding: 1rem;">${s.Batch}</td>
          <td style="padding: 1rem;">${s.Section}</td>
          <td style="padding: 1rem;">
            <span style="font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: ${s.Status === 'ACTIVE' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)'}; color: ${s.Status === 'ACTIVE' ? 'var(--success)' : 'var(--error)'}; font-weight: 700;">
              ${s.Status}
            </span>
          </td>
          <td style="padding: 1rem;">
            ${s.Status === 'ACTIVE' ? `
              <button class="btn btn-ghost" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; color: var(--error); border-color: var(--error);"
                onclick="window.deleteStudent('${s.RegisterNo}')">Delete</button>
            ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Disabled</span>'}
          </td>
        </tr>
      `).join('');
    } catch (error) {
      studentTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--error); padding: 2rem;">${error.message}</td></tr>`;
    }
  }

  applyFiltersBtn.addEventListener('click', loadStudents);

  // Add Student Modal
  btnAddStudent.addEventListener('click', () => addStudentModal.style.display = 'flex');
  closeAddModal.addEventListener('click', () => addStudentModal.style.display = 'none');

  addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      regNo: document.getElementById('regNo').value,
      name: document.getElementById('name').value,
      batch: document.getElementById('batch').value,
      section: document.getElementById('section').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      gender: document.getElementById('gender').value,
      dept: 'AI&DS',
      sem: document.getElementById('sem').value,
      secretKey: document.getElementById('secretKey').value
    };

    try {
      const res = await API.request('createStudent', payload);
      alert(res.message);
      addStudentForm.reset();
      addStudentModal.style.display = 'none';
      loadStudents();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });

  // Delete Student
  window.deleteStudent = async (regNo) => {
    if (!confirm(`Are you sure you want to delete/disable student ${regNo}?`)) return;
    try {
      const res = await API.request('deleteStudent', { regNo });
      alert(res.message);
      loadStudents();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Bulk Import
  btnBulkImport.addEventListener('click', () => bulkImportModal.style.display = 'flex');
  closeBulkModal.addEventListener('click', () => bulkImportModal.style.display = 'none');

  processBulkBtn.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
      alert('Please select a CSV file first');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split('\n').slice(1); // Skip header
      const students = rows.filter(row => row.trim()).map(row => {
        const cols = row.split(',');
        return {
          RegisterNo: cols[0]?.trim(),
          Name: cols[1]?.trim(),
          Batch: cols[2]?.trim(),
          Section: cols[3]?.trim(),
          Email: cols[4]?.trim(),
          Phone: cols[5]?.trim(),
          Gender: cols[6]?.trim(),
          Department: cols[7]?.trim() || 'AI&DS',
          Semester: cols[8]?.trim() || '1'
        };
      });

      try {
        const res = await API.request('bulkCreateStudents', { students });
        console.log('Keys generated:', res.data);

        // Create CSV for the keys to download
        let csvContent = "data:text/csv;charset=utf-8,RegisterNo,Name,SecretKey\n";
        res.data.forEach(row => {
          csvContent += `${row.RegisterNo},${row.Name},${row.SecretKey}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_keys.csv");
        document.body.appendChild(link);
        link.click();

        alert(res.message);
        bulkImportModal.style.display = 'none';
        loadStudents();
      } catch (error) {
        alert('Bulk Import Error: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // --- VERIFICATION QUEUE ---
  tabAch.addEventListener('click', () => {
    currentVerifType = 'ACH';
    tabAch.className = 'btn btn-primary';
    tabCert.className = 'btn btn-ghost';
    loadQueue();
  });

  tabCert.addEventListener('click', () => {
    currentVerifType = 'CERT';
    tabCert.className = 'btn btn-primary';
    tabAch.className = 'btn btn-ghost';
    loadQueue();
  });

  async function loadQueue() {
    queueContent.innerHTML = `<div class="flex-center" style="height: 60vh;"><p>Loading pending requests...</p></div>`;
    try {
      const action = currentVerifType === 'ACH' ? 'getVerificationQueue' : 'getCertificationQueue';
      const data = await API.request(action);

      if (data.length === 0) {
        queueContent.innerHTML = `<div class="flex-center" style="height: 60vh; text-align: center;"><p>No pending requests.</p></div>`;
        return;
      }

      queueContent.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: var(--radius); box-shadow: var(--shadow); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Student</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Item</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Details</th>
                <th style="padding: 1rem; color: var(--text-muted); font-weight: 600;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 1rem;">${item.registerNo}</td>
                  <td style="padding: 1rem;">${currentVerifType === 'ACH' ? item.eventName : item.courseName}</td>
                  <td style="padding: 1rem;">${currentVerifType === 'ACH' ? item.level : item.platform}</td>
                  <td style="padding: 1rem;">
                    <button class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"
                      onclick="window.openVerifyModal('${item.achievementId || item.certificationId}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                      Review
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      queueContent.innerHTML = `<p style="color: var(--error);">Error: ${error.message}</p>`;
    }
  }

  window.openVerifyModal = (id, data) => {
    selectedRecordId = id;
    recordDetails.innerHTML = `
      <p><strong>Student:</strong> ${data.registerNo}</p>
      <p><strong>Item:</strong> ${currentVerifType === 'ACH' ? data.eventName : data.courseName}</p>
      <p><strong>Proof:</strong> <a href="${data.proofReference || '#'}" target="_blank">View Document</a></p>
    `;
    verifyModal.style.display = 'flex';
  };

  async function submitVerification(status) {
    const remarks = remarksInput.value;
    const action = currentVerifType === 'ACH' ? 'verifyAchievement' : 'verifyCertification';
    const payload = {
      [currentVerifType === 'ACH' ? 'achievementId' : 'certificationId']: selectedRecordId,
      status: status,
      verifiedBy: 'AIDS-STAFF',
      remarks: remarks
    };

    try {
      const res = await API.request(action, payload);
      alert(res.message);
      verifyModal.style.display = 'none';
      remarksInput.value = '';
      loadQueue();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  verifyBtn.addEventListener('click', () => submitVerification('VERIFIED'));
  rejectBtn.addEventListener('click', () => submitVerification('REJECTED'));
  closeVerifyModal.addEventListener('click', () => verifyModal.style.display = 'none');

  // Initial Load
  showSection('students');
});
