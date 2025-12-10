import { apiRequest } from '../config/apiConfig';
import config from '../config/apiConfig';
import { creditCardStorage } from '../utils/creditCardStorage';

// Helper function to handle credit card storage
export const handleCreditCardStorage = (formData) => {
  if (formData.paymentType === 'cc') {
    const ccDetails = {
      ccNumber: formData.ccNumber,
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      zipCode: formData.zipCode
    };
    return creditCardStorage.save(ccDetails);
  }
  return null;
};

// Rides API
export const ridesAPI = {
  // Get all rides
  getAll: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.GET_ALL, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch all rides:', error);
      // Return mock data for development
      return [
    //     { id: 1, customerId: 101, status: 'assigned', pickup: '123 Main St', destination: '456 Oak Ave', driverId: 201 },
    //     { id: 2, customerId: 102, status: 'in-progress', pickup: '789 Pine Rd', destination: '321 Elm St', driverId: 202 }
      ];
    }
  },

  // Get assigned rides
  getAssigned: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.GET_ASSIGNED, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch assigned rides:', error);
      // Return mock data for development
      return [
    //     { id: 1, customerId: 101, status: 'assigned', pickup: '123 Main St', destination: '456 Oak Ave', driverId: 201 }
      ];
    }
  },

  // Get rides in progress
  getInProgress: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.GET_IN_PROGRESS, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch in-progress rides:', error);
      // Return mock data for development
      return [
        // { id: 2, customerId: 102, status: 'in-progress', pickup: '789 Pine Rd', destination: '321 Elm St', driverId: 202 }
      ];
    }
  },

  // Get future rides (scheduled)
  getFuture: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.GET_FUTURE, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch future rides:', error);
      // Return mock data for development
      return [
        // { id: 3, customerId: 103, status: 'scheduled', pickup: '456 Elm St', destination: '789 Oak Ave', scheduledFor: '2025-10-06T14:30:00Z', driverId: null },
        // { id: 4, customerId: 104, status: 'scheduled', pickup: '321 Maple St', destination: '654 Pine St', scheduledFor: '2025-10-07T09:15:00Z', driverId: null }
      ];
    }
  },

  // Get today's rides
  getToday: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.GET_TODAY, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch today\'s rides:', error);
      // Return mock data for development
      const today = new Date().toISOString().split('T')[0];
      return [
        // { id: 1, customerId: 101, status: 'assigned', pickup: '123 Main St', destination: '456 Oak Ave', callTime: today + 'T08:30:00Z', driverId: 201 },
        // { id: 2, customerId: 102, status: 'in-progress', pickup: '789 Pine Rd', destination: '321 Elm St', callTime: today + 'T10:15:00Z', driverId: 202 },
        // { id: 5, customerId: 105, status: 'completed', pickup: '111 First St', destination: '222 Second St', callTime: today + 'T07:45:00Z', driverId: 203 }
      ];
    }
  },

  // Get ride by ID
  getById: async (id) => {
    try {
      return await apiRequest(`${config.ENDPOINTS.RIDES.GET_BY_ID}/${id}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error(`Failed to fetch ride ${id}:`, error);
      // Return mock data for development
      return {
        // id: id,
        // customerId: 101,
        // customerName: 'John Smith',
        // customerNumber: '+1234567890',
        // status: 'assigned',
        // pickup: '123 Main St, City, State 12345',
        // destination: '456 Oak Ave, City, State 12345',
        // driverId: 201,
        // driverName: 'Mike Johnson',
        // estimatedTime: '15 minutes',
        // fare: '$25.50',
        // createdAt: new Date().toISOString()
      };
    }
  },

  // Create new ride using NewRide data structure
  create: async (newRideData) => {
    try {
      // newRideData should be in format: { Ride: {...}, Route: {...} }
      return await apiRequest(config.ENDPOINTS.RIDES.CREATE, {
        method: 'POST',
        body: JSON.stringify(newRideData)
      });
    } catch (error) {
      console.error('Failed to create ride:', error);
      throw error;
    }
  }
};

// Helper function to build NewRide data structure
export const buildNewRideData = (formData, scheduledFor = null) => {
  // Build Routes object
  const route = {
    RouteId: 0, // Will be set by server
    Pickup: formData.pickupLocation,
    DropOff: formData.dropoffLocation,
    Stop1: formData.additionalStops[0] || '',
    Stop2: formData.additionalStops[1] || '',
    Stop3: formData.additionalStops[2] || '',
    Stop4: formData.additionalStops[3] || '',
    RoundTrip: formData.isRoundTrip,
    CallTime: new Date().toISOString(),
    RideId: 0 // Will be set by server
  };

  // Build Ride object
  const ride = {
    RideId: 0, // Will be set by server
    CustomerId: null, // To be filled later
    CustomerPhoneNumber: formData.customerNumber,
    CallTime: scheduledFor ? scheduledFor : new Date().toISOString(),
    PickupTime: null,
    DropOffTime: null, // To be filled later
    Cost: 0, // To be calculated later
    DriversCompensation: 0, // To be calculated later
    PaidTime: null, // To be filled later
    AssignedToId: null, // To be assigned later
    ReassignedToId: null,
    Notes: formData.notes || '',
    DispatchedById: formData.dispatcherId, // Set to dispatcherId of the logged in user
    PaymentType: formData.paymentType
  };

  return {
    Ride: ride,
    Route: route
  };
};

// Drivers API
export const driversAPI = {
  // Get all drivers
  getAll: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.DRIVERS.GET_ALL, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch all drivers:', error);
      // Return mock data for development
      return [
        // { id: 201, name: 'Mike Johnson', status: 'active', isCurrentlyDriving: false, phone: '+1234567890' },
        // { id: 202, name: 'Sarah Williams', status: 'active', isCurrentlyDriving: true, phone: '+0987654321' },
        // { id: 203, name: 'David Brown', status: 'active', isCurrentlyDriving: false, phone: '+1122334455' }
      ];
    }
  },

  // Get active drivers
  getActive: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.DRIVERS.GET_ACTIVE, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch active drivers:', error);
      // Return mock data for development
      return [
        // { id: 201, name: 'Mike Johnson', status: 'active', isCurrentlyDriving: false, phone: '+1234567890' },
        // { id: 202, name: 'Sarah Williams', status: 'active', isCurrentlyDriving: true, phone: '+0987654321' },
        // { id: 203, name: 'David Brown', status: 'active', isCurrentlyDriving: false, phone: '+1122334455' }
      ];
    }
  },

  // Get drivers currently driving
  getDriving: async () => {
    try {
      return await apiRequest(config.ENDPOINTS.DRIVERS.GET_DRIVING, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to fetch driving drivers:', error);
      // Return mock data for development
      return [
        // { id: 202, name: 'Sarah Williams', status: 'active', isCurrentlyDriving: true, phone: '+0987654321' }
      ];
    }
  },

  // Get driver by ID
  getById: async (id) => {
    try {
      return await apiRequest(`${config.ENDPOINTS.DRIVERS.GET_BY_ID}/${id}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error(`Failed to fetch driver ${id}:`, error);
      // Return mock data for development
      return {
    //     id: id,
    //     name: 'Mike Johnson',
    //     status: 'active',
    //     isCurrentlyDriving: false,
    //     phone: '+1234567890',
    //     email: 'mike.johnson@company.com',
    //     vehicle: 'Toyota Camry 2022',
    //     licenseNumber: 'DL123456789',
    //     rating: 4.8,
    //     totalRides: 245,
    //     joinedDate: '2023-01-15'
     };
    }
  }
};