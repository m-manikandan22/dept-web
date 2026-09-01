/**
 * Reports.gs
 * Departmental Analytics and Reporting Logic
 */

const Reports = {
  /**
   * Generates a high-level dashboard summary for the Admin
   */
  getDashboardStats: function() {
    const students = Utils.getSheetData('Students');
    const fees = Utils.getSheetData('Fees');
    const payments = Utils.getSheetData('Payments');
    const hostel = Utils.getSheetData('Hostel');
    const transport = Utils.getSheetData('Transport');
    const achievements = Utils.getSheetData('Achievements');
    const certifications = Utils.getSheetData('Certifications');

    // 1. Student Counts
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.Status === 'ACTIVE').length;

    // 2. Fee Analytics
    const totalFeeExpected = fees.reduce((sum, f) => sum + Number(f.TotalAmount || 0), 0);
    const totalFeeCollected = payments.reduce((sum, p) => sum + Number(p.Amount || 0), 0);
    const totalFeePending = totalFeeExpected - totalFeeCollected;

    // 3. Facility Stats
    const hostellers = hostel.filter(h => h.AccommodationType === 'Hosteller').length;
    const dayScholars = totalStudents - hostellers;
    const busUsers = transport.filter(t => t.UsesCollegeBus === true || t.UsesCollegeBus === 'true').length;

    // 4. Verification Stats
    const verifiedAch = achievements.filter(a => a.VerificationStatus === 'VERIFIED').length;
    const pendingAch = achievements.filter(a => a.VerificationStatus === 'PENDING').length;
    const verifiedCert = certifications.filter(c => c.VerificationStatus === 'VERIFIED').length;
    const pendingCert = certifications.filter(c => c.VerificationStatus === 'PENDING').length;

    return {
      status: 'success',
      data: {
        general: {
          totalStudents,
          activeStudents,
        },
        finance: {
          totalExpected: totalFeeExpected,
          totalCollected: totalFeeCollected,
          totalPending: totalFeePending,
          collectionRate: totalFeeExpected > 0 ? ((totalFeeCollected / totalFeeExpected) * 100).toFixed(2) : 0
        },
        facilities: {
          hostellers,
          dayScholars,
          busUsers
        },
        verifications: {
          verifiedAchievements: verifiedAch,
          pendingAchievements: pendingAch,
          verifiedCertifications: verifiedCert,
          pendingCertifications: pendingCert
        }
      }
    };
  },

  /**
   * Generates a report of students with pending fees
   */
  getPendingFeesReport: function() {
    const fees = Utils.getSheetData('Fees');
    const payments = Utils.getSheetData('Payments');
    const students = Utils.getSheetData('Students');

    const pendingReport = [];

    // For each student, calculate their total pending balance
    students.forEach(student => {
      const regNo = student.RegisterNo;
      const studentFees = fees.filter(f => f.RegisterNo == regNo);
      const studentPayments = payments.filter(p => p.RegisterNo == regNo);

      const totalExpected = studentFees.reduce((sum, f) => sum + Number(f.TotalAmount || 0), 0);
      const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.Amount || 0), 0);
      const balance = totalExpected - totalPaid;

      if (balance > 0) {
        pendingReport.push({
          registerNo: regNo,
          name: student.Name,
          batch: student.Batch,
          balance: balance
        });
      }
    });

    return {
      status: 'success',
      data: pendingReport
    };
  }
};
