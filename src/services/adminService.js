import { apiRequest } from '../config/apiConfig';
import config from '../config/apiConfig';

// Admin API functions for managing dispatchers, drivers, and cars
export const adminAPI = {
  
  // Dispatchers Management
  dispatchers: {
    // Get all active dispatchers
    getActive: async () => {
      try {
        return await apiRequest(config.ENDPOINTS.DISPATCHERS.GET_ACTIVE, {
          method: 'GET'
        });
      } catch (error) {
        console.error('Failed to fetch active dispatchers:', error);
        // Return mock data for development
        return [
          { id: 1, name: 'John Admin', email: 'john@company.com', phone: '+1234567890', role: 'admin', isActive: true, joinedDate: '2023-01-15' },
          { id: 2, name: 'Sarah Manager', email: 'sarah@company.com', phone: '+0987654321', role: 'dispatcher', isActive: true, joinedDate: '2023-03-20' },
          { id: 3, name: 'Mike Supervisor', email: 'mike@company.com', phone: '+1122334455', role: 'dispatcher', isActive: true, joinedDate: '2023-06-10' }
        ];
      }
    },

    // Get dispatcher by ID
    getById: async (id) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.DISPATCHERS.GET_BY_ID}/${id}`, {
          method: 'GET'
        });
      } catch (error) {
        console.error(`Failed to fetch dispatcher ${id}:`, error);
        throw error;
      }
    },

    // Create new dispatcher
    create: async (dispatcherData) => {
      try {
        return await apiRequest(config.ENDPOINTS.DISPATCHERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(dispatcherData)
        });
      } catch (error) {
        console.error('Failed to create dispatcher:', error);
        throw error;
      }
    },

    // Update dispatcher
    update: async (id, dispatcherData) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.DISPATCHERS.UPDATE}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dispatcherData)
        });
      } catch (error) {
        console.error('Failed to update dispatcher:', error);
        throw error;
      }
    },

    // Delete dispatcher
    delete: async (id) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.DISPATCHERS.DELETE}/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete dispatcher:', error);
        throw error;
      }
    }
  },

  // Drivers Management
  drivers: {
    // Get all active drivers (extended version)
    getActive: async () => {
      try {
        return await apiRequest(config.ENDPOINTS.DRIVERS.GET_ACTIVE, {
          method: 'GET'
        });
      } catch (error) {
        console.error('Failed to fetch active drivers:', error);
        // Return mock data for development
        return [
          { id: 201, name: 'Mike Johnson', email: 'mike.j@company.com', phone: '+1234567890', licenseNumber: 'DL123456789', isActive: true, joinedDate: '2023-02-01', rating: 4.8 },
          { id: 202, name: 'Sarah Williams', email: 'sarah.w@company.com', phone: '+0987654321', licenseNumber: 'DL987654321', isActive: true, joinedDate: '2023-04-15', rating: 4.9 },
          { id: 203, name: 'David Brown', email: 'david.b@company.com', phone: '+1122334455', licenseNumber: 'DL555666777', isActive: true, joinedDate: '2023-07-20', rating: 4.6 }
        ];
      }
    },

     // Get all drivers (extended version)
    getAll: async () => {
      try {
        return await apiRequest(config.ENDPOINTS.DRIVERS.GET_ALL, {
          method: 'GET'
        });
      } catch (error) {
        console.error('Failed to fetch active drivers:', error);
        // Return mock data for development
        return [
        //   { id: 201, name: 'Mike Johnson', email: 'mike.j@company.com', phone: '+1234567890', licenseNumber: 'DL123456789', isActive: true, joinedDate: '2023-02-01', rating: 4.8 },
        //   { id: 202, name: 'Sarah Williams', email: 'sarah.w@company.com', phone: '+0987654321', licenseNumber: 'DL987654321', isActive: true, joinedDate: '2023-04-15', rating: 4.9 },
        //   { id: 203, name: 'David Brown', email: 'david.b@company.com', phone: '+1122334455', licenseNumber: 'DL555666777', isActive: true, joinedDate: '2023-07-20', rating: 4.6 }
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
        throw error;
      }
    },

    // Create new driver
    create: async (driverData) => {
      try {
        return await apiRequest(config.ENDPOINTS.DRIVERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(driverData)
        });
      } catch (error) {
        console.error('Failed to create driver:', error);
        throw error;
      }
    },

    // Update driver
    update: async (id, driverData) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.DRIVERS.UPDATE}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(driverData)
        });
      } catch (error) {
        console.error('Failed to update driver:', error);
        throw error;
      }
    },

    // Delete driver
    delete: async (id) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.DRIVERS.DELETE}/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete driver:', error);
        throw error;
      }
    }
  },

  // Cars Management
  cars: {
    // Get cars by driver ID
    getByDriver: async (driverId) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.CARS.GET_BY_DRIVER}/${driverId}`, {
          method: 'GET'
        });
      } catch (error) {
        console.error(`Failed to fetch cars for driver ${driverId}:`, error);
        // Return mock data for development
        return [
          { id: 301, driverId: driverId, make: 'Toyota', model: 'Camry', year: 2022, color: 'Silver', licensePlate: 'ABC123', vin: '1HGCM82633A123456' },
          { id: 302, driverId: driverId, make: 'Honda', model: 'Accord', year: 2021, color: 'White', licensePlate: 'XYZ789', vin: '1HGCM82633A789012' }
        ];
      }
    },

    // Create new car
    create: async (carData) => {
      try {
        return await apiRequest(config.ENDPOINTS.CARS.CREATE, {
          method: 'POST',
          body: JSON.stringify(carData)
        });
      } catch (error) {
        console.error('Failed to create car:', error);
        throw error;
      }
    },

    // Update car
    update: async (id, carData) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.CARS.UPDATE}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(carData)
        });
      } catch (error) {
        console.error('Failed to update car:', error);
        throw error;
      }
    },

    // Delete car
    delete: async (id) => {
      try {
        return await apiRequest(`${config.ENDPOINTS.CARS.DELETE}/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete car:', error);
        throw error;
      }
    }
  },

  // User role checking
  user: {
    // Check if user has admin role
    checkRole: async (userId) => {
      try {
        if (!userId) {
          throw new Error('UserId is required for role checking');
        }
        
        const response = await apiRequest(`${config.ENDPOINTS.USER.CHECK_ROLE}?userId=${userId}`, {
          method: 'GET'
        });
        
        // The endpoint returns a boolean, so we return an object with isAdmin property
        return { isAdmin: response };
      } catch (error) {
        console.error('Failed to check user role:', error);
        // Return mock admin role for development
        return { isAdmin: true };
      }
    },

    // Get user profile
    getProfile: async () => {
      try {
        return await apiRequest(config.ENDPOINTS.USER.GET_PROFILE, {
          method: 'GET'
        });
      } catch (error) {
        console.error('Failed to get user profile:', error);
        throw error;
      }
    }
  }
};