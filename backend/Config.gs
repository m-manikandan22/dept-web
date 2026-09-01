/**
 * Config.gs
 * Global configuration for the IIDS Portal
 */

const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', // User must replace this
  APP_NAME: 'IIDS Student Portal',
  SESSION_EXPIRY_HOURS: 24,
  HASH_SALT: 'IIDS_SECRET_SALT_2026', // Used for hashing secret keys
};

// Helper to get the active spreadsheet
function getSS() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

// Helper to get a specific sheet by name
function getSheet(name) {
  return getSS().getSheetByName(name);
}
