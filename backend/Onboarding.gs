/**
 * Onboarding.gs
 * Handles first-time student setup and dynamic fee assignment
 */

const Onboarding = {
  /**
   * Checks if a student has completed their initial setup
   */
  checkStatus: function(registerNo) {
    const onboarded = Utils.getRowByKey('Onboarding', 'RegisterNo', registerNo);
    return {
      status: 'success',
      isCompleted: !!onboarded
    };
  },

  /**
   * Completes the onboarding process and assigns fees
   */
  complete: function(registerNo, payload) {
    const { accommodationType, transportMode } = payload;

    if (!accommodationType) {
      return { status: 'error', error: 'Accommodation type is required' };
    }

    // 1. Mark as onboarded
    Utils.appendRow('Onboarding', {
      RegisterNo: registerNo,
      AccommodationType: accommodationType,
      TransportMode: transportMode || 'N/A',
      CompletedAt: Utils.now()
    });

    // 2. Dynamic Fee Assignment
    // Base Tuition Fee for everyone
    Fees.createFeeRecord(registerNo, 'Tuition', 45000);

    if (accommodationType === 'Hosteller') {
      Fees.createFeeRecord(registerNo, 'Hostel', 60000);
    } else if (accommodationType === 'Day Scholar' && transportMode === 'College Bus') {
      Fees.createFeeRecord(registerNo, 'Transport', 12000);
    }

    Audit.log(registerNo, 'STUDENT', 'COMPLETE_ONBOARDING', 'ONBOARDING', 'SUCCESS', `Onboarded as ${accommodationType} / ${transportMode || 'N/A'}`);

    return {
      status: 'success',
      message: 'Onboarding completed. Your fee structure has been generated.'
    };
  }
};
