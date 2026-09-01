/**
 * Academics.gs
 * Academic performance and records management
 */

const Academics = {
  /**
   * Retrieves the academic history for a specific student
   */
  getStudentAcademics: function(registerNo, payload) {
    const allRecords = Utils.getSheetData('Academics');
    const studentRecords = allRecords.filter(r => r.RegisterNo == registerNo);

    if (studentRecords.length === 0) {
      return {
        status: 'error',
        error: 'No academic records found for this student'
      };
    }

    // Sort by semester descending
    studentRecords.sort((a, b) => Number(b.Semester) - Number(a.Semester));

    return {
      status: 'success',
      data: studentRecords.map(r => ({
        academicId: r.AcademicID,
        year: r.AcademicYear,
        semester: r.Semester,
        sgpa: r.SGPA,
        cgpa: r.CGPA,
        backlogs: r.Backlogs,
        remarks: r.AcademicRemarks,
        status: r.AcademicStatus,
        updatedAt: r.UpdatedAt
      }))
    };
  }
};
