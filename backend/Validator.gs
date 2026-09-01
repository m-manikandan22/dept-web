/**
 * Security Hardening Additions to Utils.gs
 */

// This content is intended to be merged into Utils.gs or added as a separate security helper.
// Since we are in a phase of hardening, I will implement a robust validation helper.

const Validator = {
  /**
   * Validates that a value exists and matches a simple regex or type
   */
  validate: function(value, rule, fieldName) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }

    if (rule === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) throw new Error(`Invalid email format for ${fieldName}`);
    }

    if (rule === 'numeric') {
      if (isNaN(Number(value))) throw new Error(`${fieldName} must be a number`);
    }

    if (rule === 'date') {
      if (isNaN(Date.parse(value))) throw new Error(`Invalid date format for ${fieldName}`);
    }

    if (rule === 'regno') {
      // Example: 23AD101
      const regRegex = /^\d{2}[A-Z]{2}\d{3,}$/;
      if (!regRegex.test(value)) throw new Error(`Invalid Register Number format for ${fieldName}`);
    }

    return true;
  }
};
