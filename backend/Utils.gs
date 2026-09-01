/**
 * Utils.gs
 * Generic spreadsheet and helper utilities
 */

const Utils = {
  /**
   * Converts a sheet's data to an array of objects using headers as keys
   */
  getSheetData: function(sheetName) {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    return data.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  },

  /**
   * Finds a single row in a sheet by a specific column value
   */
  getRowByKey: function(sheetName, keyColumn, keyValue) {
    const data = this.getSheetData(sheetName);
    return data.find(row => row[keyColumn] == keyValue) || null;
  },

  /**
   * Appends a row to a sheet based on an object mapping headers to values
   */
  appendRow: function(sheetName, dataObj) {
    const sheet = getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(header => dataObj[header] || '');
    sheet.appendRow(row);
    return true;
  },

  /**
   * Updates a row in a sheet based on a key
   */
  updateRow: function(sheetName, keyColumn, keyValue, updateObj) {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyIndex = headers.indexOf(keyColumn);

    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] == keyValue) {
        const rowNum = i + 1;
        for (const [key, value] of Object.entries(updateObj)) {
          const colIndex = headers.indexOf(key);
          if (colIndex !== -1) {
            sheet.getRange(rowNum, colIndex + 1).setValue(value);
          }
        }
        return true;
      }
    }
    return false;
  },

  /**
   * Simple hash function for secret keys (sha256 simulation via Utilities.computeDigest)
   */
  hashKey: function(text) {
    const salt = CONFIG.HASH_SALT;
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text + salt);
    let hash = '';
    for (let i = 0; i < signature.length; i++) {
      let byte = signature[i];
      if (byte < 0) byte += 256;
      let hex = byte.toString(16);
      if (hex.length === 1) hex = '0' + hex;
      hash += hex;
    }
    return hash;
  },

  /**
   * Generates a unique ID like 'STU-0001'
   */
  generateId: function(prefix, sheetName) {
    const data = this.getSheetData(sheetName);
    const count = data.length;
    return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
  },

  /**
   * Formats dates to ISO string
   */
  now: function() {
    return new Date().toISOString();
  }
};
