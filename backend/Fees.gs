/**
 * Fees.gs
 * Dynamic Fee Structure and Balance Management (Version 2.0)
 */

const Fees = {
  /**
   * Internal helper to create a fee record for a student
   */
  createFeeRecord: function(registerNo, feeType, amount) {
    const feeId = Utils.generateId('FEE', 'Fees');
    Utils.appendRow('Fees', {
      FeeID: feeId,
      RegisterNo: registerNo,
      AcademicYear: '2026-2027',
      Semester: 5,
      FeeType: feeType,
      TotalAmount: amount,
      DueDate: '2026-09-30',
      Status: 'PENDING',
      CreatedAt: Utils.now(),
      UpdatedAt: Utils.now()
    });
    return feeId;
  },

  /**
   * Retrieves summarized fees for a student, split by category
   */
  getStudentFees: function(registerNo, payload) {
    const allFees = Utils.getSheetData('Fees');
    const studentFees = allFees.filter(f => f.RegisterNo == registerNo);

    if (studentFees.length === 0) {
      return { status: 'error', error: 'No fee records found. Please complete onboarding.' };
    }

    const payments = Utils.getSheetData('Payments');
    const studentPayments = payments.filter(p => p.RegisterNo == registerNo);

    const breakdown = studentFees.map(fee => {
      const paid = studentPayments
        .filter(p => p.FeeID == fee.FeeID)
        .reduce((sum, p) => sum + Number(p.Amount || 0), 0);

      const total = Number(fee.TotalAmount || 0);

      return {
        feeId: fee.FeeID,
        type: fee.FeeType,
        total: total,
        paid: paid,
        pending: total - paid,
        status: fee.Status
      };
    });

    const totals = breakdown.reduce((acc, curr) => {
      acc.total += curr.total;
      acc.paid += curr.paid;
      acc.pending += curr.pending;
      return acc;
    }, { total: 0, paid: 0, pending: 0 });

    return {
      status: 'success',
      data: {
        breakdown,
        totals
      }
    };
  }
};
