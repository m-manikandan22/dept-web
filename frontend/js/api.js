/**
 * api.js
 * Core communication layer with Google Apps Script Backend
 */

const API = {
  // USER MUST REPLACE THIS with the deployed GAS Web App URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbwZkrC1mPV1pWu3Fw45TzOAo6hyin84aBfHSb2lab2kAB-etxecuX4lL_YtGJAh9dPX/exec',

  /**
   * Sends a POST request to the backend
   */
  async request(action, payload = {}, token = null) {
    const requestBody = {
      action: action,
      token: token || sessionStorage.getItem('iids_token'),
      payload: payload
    };

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        mode: 'no-cors', // GAS requires no-cors for simple POST, but this means we can't read the response.
        // IMPORTANT: To read responses from GAS, the GAS app must return a proper JSON response
        // and the frontend must handle the Redirect (302) which GAS does.
        // However, fetch with 'no-cors' won't allow reading the response.
        // To fix this in production, GAS must be accessed via a proxy or
        // the fetch must be handled carefully.

        // CORRECT WAY for GAS:
        // GAS Web Apps respond to POST with a redirect.
        // We should use 'cors' mode and the server must return JSON.

        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS prefers text/plain to avoid pre-flight
        },
        body: JSON.stringify(requestBody)
      });

      // Note: Since GAS redirects and CORS can be tricky,
      // we often use a simple helper.
      // For this implementation, we assume a standard JSON POST flow.

      // Actual implementation for GAS:
      const res = await fetch(this.BASE_URL, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const result = await res.json();

      if (result.status === 'error') {
        throw new Error(result.error || 'Unknown Backend Error');
      }

      return result.data || result;

    } catch (error) {
      console.error(`API Error [${action}]:`, error);
      throw error;
    }
  }
};
