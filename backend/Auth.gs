/**
 * Auth.gs
 * Authentication and Authorization Logic
 */

const Auth = {
  /**
   * Handles the login process
   */
  login: function(payload) {
    const { registerNo, secretKey } = payload;

    if (!registerNo || !secretKey) {
      return { status: 'error', error: 'Missing credentials' };
    }

    const userKey = Utils.getRowByKey('AccessKeys', 'RegisterNo', registerNo);
    if (!userKey) {
      return { status: 'error', error: 'Invalid credentials' };
    }

    const hashedInput = Utils.hashKey(secretKey);
    if (userKey.SecretKeyHash !== hashedInput) {
      return { status: 'error', error: 'Invalid credentials' };
    }

    if (userKey.Status !== 'ACTIVE') {
      return { status: 'error', error: 'Account is disabled' };
    }

    // Create session
    const token = Utilities.getUuid();
    const sessionData = {
      Token: token,
      RegisterNo: registerNo,
      Role: userKey.Role,
      CreatedAt: Utils.now(),
      ExpiresAt: new Date(Date.now() + CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
    };

    Utils.appendRow('Sessions', sessionData);

    // Update last login
    Utils.updateRow('AccessKeys', 'RegisterNo', registerNo, { LastLogin: Utils.now() });

    // Log login event
    Audit.log(registerNo, userKey.Role, 'LOGIN', 'AUTH', 'SUCCESS', 'User logged in successfully');

    return {
      status: 'success',
      data: {
        token: token,
        role: userKey.Role,
        registerNo: registerNo
      }
    };
  },

  /**
   * Validates if a session token is active and not expired
   */
  validateSession: function(token) {
    if (!token) return null;

    const session = Utils.getRowByKey('Sessions', 'Token', token);
    if (!session) return null;

    const now = new Date();
    const expiry = new Date(session.ExpiresAt);

    if (now > expiry) {
      // Session expired - delete it
      this.logout(token);
      return null;
    }

    return {
      registerNo: session.RegisterNo,
      role: session.Role
    };
  },

  /**
   * Ends a session
   */
  logout: function(token) {
    // In a real GS app, we'd delete the row from 'Sessions'
    // For now, we'll just mark it as expired or delete it if we had a delete helper
    const session = Utils.getRowByKey('Sessions', 'Token', token);
    if (session) {
      // Simulating deletion by updating expiry to now
      Utils.updateRow('Sessions', 'Token', token, { ExpiresAt: Utils.now() });
    }
    return { status: 'success', message: 'Logged out' };
  },

  /**
   * Role-Based Access Control matrix
   */
  authorize: function(role, action) {
    const permissions = {
      'STUDENT': [
        'getStudentProfile',
        'getStudentFees',
        'getStudentPayments',
        'submitPayment',
        'completeOnboarding',
        'getStudentAchievements',
        'submitAchievement',
        'getStudentCertifications',
        'submitCertification',
        'logout'
      ],
      'STAFF': [
        'getStudents',
        'createStudent',
        'deleteStudent',
        'bulkCreateStudents',
        'getVerificationQueue',
        'verifyAchievement',
        'verifyCertification',
        'getDashboardStats',
        'getAuditLogs',
        'logout'
      ],
      'ADMIN': 'ALL'
    };

    if (role === 'ADMIN') return true;
    const rolePerms = permissions[role];
    return rolePerms && rolePerms.includes(action);
  }
};
