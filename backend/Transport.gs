/**
 * Transport.gs
 * College Transport and Bus management
 */

const Transport = {
  /**
   * Retrieves transport information for a specific student
   */
  getStudentTransport: function(registerNo, payload) {
    const transportData = Utils.getRowByKey('Transport', 'RegisterNo', registerNo);

    if (!transportData) {
      return {
        status: 'success',
        data: {
          UsesCollegeBus: false,
          Route: 'N/A',
          BusNumber: 'N/A',
          TransportFee: 0,
          Status: 'ACTIVE'
        }
      };
    }

    return {
      status: 'success',
      data: transportData
    };
  }
};
