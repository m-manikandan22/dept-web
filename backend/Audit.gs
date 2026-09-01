/**
 * Audit.gs
 * Audit Logging System
 */

const Audit = {
  /**
   * Writes an entry to the AuditLog sheet
   */
  log: function(userId, role, action, module, result, remarks) {
    const logEntry = {
      LogID: Utils.generateId('LOG', 'AuditLog'),
      Timestamp: Utils.now(),
      UserID: userId,
      Role: role,
      Action: action,
      Module: module,
      Result: result,
      Remarks: remarks
    };

    Utils.appendRow('AuditLog', logEntry);
  },

  /**
   * Retrieves audit logs for Admin review
   */
  getLogs: function(payload) {
    const logs = Utils.getSheetData('AuditLog');

    // Filter by action or module if provided in payload
    let filteredLogs = logs;
    if (payload.action) {
      filteredLogs = filteredLogs.filter(l => l.Action == payload.action);
    }
    if (payload.module) {
      filteredLogs = filteredLogs.filter(l => l.Module == payload.module);
    }

    // Sort by timestamp descending
    filteredLogs.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    return {
      status: 'success',
      data: filteredLogs
    };
  }
};
