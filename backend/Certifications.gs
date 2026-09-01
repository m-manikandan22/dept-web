/**
 * Certifications.gs
 * Student certification submission and retrieval
 */

const Certifications = {
  /**
   * Retrieves certifications for a specific student
   */
  getStudentCertifications: function(registerNo, payload) {
    const allCerts = Utils.getSheetData('Certifications');
    const studentCerts = allCerts.filter(c => c.RegisterNo == registerNo);

    return {
      status: 'success',
      data: studentCerts.map(c => ({
        certificationId: c.CertificationID,
        courseName: c.CourseName,
        platform: c.Platform,
        completionDate: c.CompletionDate,
        score: c.Score,
        certificateUrl: c.CertificateURL,
        proofReference: c.ProofReference,
        status: c.VerificationStatus,
        verifiedAt: c.VerifiedAt
      }))
    };
  },

  /**
   * Handles student submission of a new certification
   */
  submitCertification: function(registerNo, payload) {
    // 1. Validation
    const required = ['CourseName', 'Platform', 'CompletionDate', 'Score'];
    for (const field of required) {
      if (!payload[field]) {
        return { status: 'error', error: `Field ${field} is required` };
      }
    }

    // 2. Create record
    const certEntry = {
      CertificationID: Utils.generateId('CERT', 'Certifications'),
      RegisterNo: registerNo,
      CourseName: payload.CourseName,
      Platform: payload.Platform,
      CompletionDate: payload.CompletionDate,
      Score: payload.Score,
      CertificateURL: payload.CertificateURL || '',
      ProofReference: payload.ProofReference || '',
      VerificationStatus: 'PENDING',
      CreatedAt: Utils.now()
    };

    Utils.appendRow('Certifications', certEntry);

    // 3. Audit Log
    Audit.log(registerNo, 'STUDENT', 'SUBMIT_CERTIFICATION', 'CERTIFICATIONS', 'SUCCESS', `Submitted ${payload.CourseName}`);

    return {
      status: 'success',
      message: 'Certification submitted successfully. It is now pending verification.'
    };
  },

  /**
   * Retrieves all certifications pending verification
   */
  getVerificationQueue: function() {
    const allCerts = Utils.getSheetData('Certifications');
    const pending = allCerts.filter(c => c.VerificationStatus === 'PENDING');

    return {
      status: 'success',
      data: pending.map(c => ({
        certificationId: c.CertificationID,
        registerNo: c.RegisterNo,
        courseName: c.CourseName,
        platform: c.Platform,
        score: c.Score,
        proofReference: c.ProofReference,
        status: c.VerificationStatus
      }))
    };
  },

  /**
   * Verifies or rejects a student certification
   */
  verifyCertification: function(payload) {
    const { certificationId, status, verifiedBy, remarks } = payload;

    if (!certificationId || !status || !verifiedBy) {
      return { status: 'error', error: 'Missing required fields for verification' };
    }

    const cert = Utils.getRowByKey('Certifications', 'CertificationID', certificationId);
    if (!cert) {
      return { status: 'error', error: 'Certification record not found' };
    }

    const updateObj = {
      VerificationStatus: status,
      VerifiedBy: verifiedBy,
      VerifiedAt: Utils.now(),
      UpdatedAt: Utils.now()
    };

    const success = Utils.updateRow('Certifications', 'CertificationID', certificationId, updateObj);

    if (success) {
      Audit.log(verifiedBy, 'STAFF', status === 'VERIFIED' ? 'VERIFY_CERTIFICATION' : 'REJECT_CERTIFICATION', 'CERTIFICATIONS', 'SUCCESS', `Certification ${certificationId} marked as ${status}. Remarks: ${remarks || 'None'}`);
      return { status: 'success', message: `Certification has been marked as ${status}` };
    }

    return { status: 'error', error: 'Failed to update certification record' };
  }
};
