/**
 * Achievements.gs
 * Student achievement submission and retrieval
 */

const Achievements = {
  /**
   * Retrieves achievements for a specific student
   */
  getStudentAchievements: function(registerNo, payload) {
    const allAchievements = Utils.getSheetData('Achievements');
    const studentAchievements = allAchievements.filter(a => a.RegisterNo == registerNo);

    return {
      status: 'success',
      data: studentAchievements.map(a => ({
        achievementId: a.AchievementID,
        category: a.Category,
        eventName: a.EventName,
        organizer: a.Organizer,
        eventDate: a.EventDate,
        level: a.Level,
        position: a.Position,
        description: a.Description,
        proofReference: a.ProofReference,
        status: a.VerificationStatus,
        verifiedAt: a.VerifiedAt
      }))
    };
  },

  /**
   * Handles student submission of a new achievement
   */
  submitAchievement: function(registerNo, payload) {
    // 1. Validation
    const required = ['Category', 'EventName', 'Organizer', 'EventDate', 'Level', 'Position'];
    for (const field of required) {
      if (!payload[field]) {
        return { status: 'error', error: `Field ${field} is required` };
      }
    }

    // 2. Create record
    const achievementEntry = {
      AchievementID: Utils.generateId('ACH', 'Achievements'),
      RegisterNo: registerNo,
      Category: payload.Category,
      EventName: payload.EventName,
      Organizer: payload.Organizer,
      EventDate: payload.EventDate,
      Level: payload.Level,
      Position: payload.Position,
      Description: payload.Description || '',
      ProofReference: payload.ProofReference || '',
      VerificationStatus: 'PENDING',
      CreatedAt: Utils.now(),
      UpdatedAt: Utils.now()
    };

    Utils.appendRow('Achievements', achievementEntry);

    // 3. Audit Log
    Audit.log(registerNo, 'STUDENT', 'SUBMIT_ACHIEVEMENT', 'ACHIEVEMENTS', 'SUCCESS', `Submitted ${payload.EventName}`);

    return {
      status: 'success',
      message: 'Achievement submitted successfully. It is now pending verification.'
    };
  },

  /**
   * Retrieves all achievements pending verification
   */
  getVerificationQueue: function() {
    const allAchievements = Utils.getSheetData('Achievements');
    const pending = allAchievements.filter(a => a.VerificationStatus === 'PENDING');

    return {
      status: 'success',
      data: pending.map(a => ({
        achievementId: a.AchievementID,
        registerNo: a.RegisterNo,
        category: a.Category,
        eventName: a.EventName,
        organizer: a.Organizer,
        level: a.Level,
        position: a.Position,
        description: a.Description,
        proofReference: a.ProofReference,
        status: a.VerificationStatus
      }))
    };
  },

  /**
   * Verifies or rejects a student achievement
   * @param {string} achievementId
   * @param {object} payload { status: 'VERIFIED' | 'REJECTED', verifiedBy: 'StaffID', remarks: '...' }
   */
  verifyAchievement: function(payload) {
    const { achievementId, status, verifiedBy, remarks } = payload;

    if (!achievementId || !status || !verifiedBy) {
      return { status: 'error', error: 'Missing required fields for verification' };
    }

    const achievement = Utils.getRowByKey('Achievements', 'AchievementID', achievementId);
    if (!achievement) {
      return { status: 'error', error: 'Achievement record not found' };
    }

    const updateObj = {
      VerificationStatus: status,
      VerifiedBy: verifiedBy,
      VerifiedAt: Utils.now(),
      UpdatedAt: Utils.now()
    };

    const success = Utils.updateRow('Achievements', 'AchievementID', achievementId, updateObj);

    if (success) {
      Audit.log(verifiedBy, 'STAFF', status === 'VERIFIED' ? 'VERIFY_ACHIEVEMENT' : 'REJECT_ACHIEVEMENT', 'ACHIEVEMENTS', 'SUCCESS', `Achievement ${achievementId} marked as ${status}. Remarks: ${remarks || 'None'}`);
      return { status: 'success', message: `Achievement has been marked as ${status}` };
    }

    return { status: 'error', error: 'Failed to update achievement record' };
  }
};
