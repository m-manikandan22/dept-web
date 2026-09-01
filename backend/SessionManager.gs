/**
 * SessionManager.gs
 * Handles cleanup of expired sessions
 */

const SessionManager = {
  /**
   * Removes all expired sessions from the Sessions sheet.
   * This should be set as a time-driven trigger in Google Apps Script.
   */
  cleanupExpiredSessions: function() {
    const sheet = getSheet('Sessions');
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    const now = new Date();
    const remainingRows = [];

    data.forEach(row => {
      const expiresAt = new Date(row[4]); // ExpiresAt column
      if (expiresAt > now) {
        remainingRows.push(row);
      }
    });

    // If any sessions expired, rewrite the sheet
    if (remainingRows.length < data.length) {
      sheet.clear();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (remainingRows.length > 0) {
        sheet.getRange(2, 1, remainingRows.length, headers.length).setValues(remainingRows);
      }
      console.log(`${data.length - remainingRows.length} expired sessions cleaned up.`);
    }
  }
};
