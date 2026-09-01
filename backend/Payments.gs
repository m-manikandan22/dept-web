/**
 * Payments.gs
 * Payment Processing and Ledger (Version 2.0)
 */

const Payments = {
  /**
   * Allows a student to submit a payment for a specific fee category
   */
  submitPayment: function(registerNo, payload) {
    const { feeId, amount, mode, reference } = payload;

    if (!feeId || !amount || !mode) {
      return { status: 'error', error: 'Fee ID, Amount, and Mode are required' };
    }

    // 1. Validate Fee ID exists for this student
    const fee = Utils.getRowByKey('Fees', 'FeeID', feeId);
    if (!fee || fee.RegisterNo != registerNo) {
      return { status: 'error', error: 'Invalid Fee ID' };
    }

    // 2. Create Payment Record
    const paymentId = Utils.generateId('PAY', 'Payments');
    Utils.appendRow('Payments', {
      PaymentID: paymentId,
      FeeID: feeId,
      RegisterNo: registerNo,
      Amount: amount,
      PaymentDate: Utils.now(),
      PaymentMode: mode, // 'Cash', 'Online', 'DD'
      TransactionReference: reference || 'N/A',
      RecordedBy: 'STUDENT',
      CreatedAt: Utils.now()
    });

    // 3. Update Fee Status if fully paid
    const allPayments = Utils.getSheetData('Payments');
    const studentPayments = allPayments.filter(p => p.FeeID == feeId);
    const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.Amount || 0), 0);

    if (totalPaid >= Number(fee.TotalAmount)) {
      Utils.updateRow('Fees', 'FeeID', feeId, { Status: 'PAID' });
    }

    Audit.log(registerNo, 'STUDENT', 'SUBMIT_PAYMENT', 'PAYMENTS', 'SUCCESS', `Paid ₹${amount} for ${fee.FeeType} via ${mode}`);

    return {
      status: 'success',
      message: 'Payment submitted successfully. It will be reflected in your balance.'
    };
  },

  /**
   * Retrieves payment history for a student
   */
  getStudentPayments: function(registerNo, payload) {
    const payments = Utils.getSheetData('Payments');
    const studentPayments = payments.filter(p => p.RegisterNo == registerNo);

    return {
      status: 'success',
      data: studentPayments.map(p => ({
        paymentId: p.PaymentID,
        amount: p.Amount,
        date: p.PaymentDate,
        mode: p.PaymentMode,
        reference: p.TransactionReference,
        feeId: p.FeeID
      }))
    };
  }
};
