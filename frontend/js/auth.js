/**
 * auth.js
 * Authentication state management
 */

const Auth = {
  /**
   * Attempts to log in a user
   */
  async login(registerNo, secretKey) {
    try {
      const data = await API.request('login', { registerNo, secretKey });

      sessionStorage.setItem('iids_token', data.token);
      sessionStorage.setItem('iids_role', data.role);
      sessionStorage.setItem('iids_user', data.registerNo);

      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Logs out the current user
   */
  async logout() {
    try {
      await API.request('logout');
    } catch (e) {
      console.warn('Logout API call failed', e);
    } finally {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  },

  /**
   * Checks if a user is currently authenticated
   */
  isAuthenticated() {
    return !!sessionStorage.getItem('iids_token');
  },

  /**
   * Gets the current user's role
   */
  getRole() {
    return sessionStorage.getItem('iids_role');
  },

  /**
   * Gets the current user's register number
   */
  getUser() {
    return sessionStorage.getItem('iids_user');
  }
};
