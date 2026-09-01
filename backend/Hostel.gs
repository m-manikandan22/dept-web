/**
 * Hostel.gs
 * Hostel and Accommodation management
 */

const Hostel = {
  /**
   * Retrieves hostel information for a specific student
   */
  getStudentHostel: function(registerNo, payload) {
    const hostelData = Utils.getRowByKey('Hostel', 'RegisterNo', registerNo);

    if (!hostelData) {
      return {
        status: 'success',
        data: {
          AccommodationType: 'Day Scholar',
          HostelName: 'N/A',
          RoomNumber: 'N/A',
          HostelFee: 0,
          MessFee: 0,
          Status: 'ACTIVE'
        }
      };
    }

    return {
      status: 'success',
      data: hostelData
    };
  }
};
