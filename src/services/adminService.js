import { driversAPI, dispatchersAPI, userAPI, carsAPI } from './apiService';

// Admin API functions for managing dispatchers, drivers, and cars
export const adminAPI = {

  // Dispatchers Management
  dispatchers: {
    // Get all active dispatchers
    getActive: async () => {
      try {
        return await dispatchersAPI.getActive();
      } catch (error) {
        console.error('Failed to fetch active dispatchers:', error);
      }
    },

    // Get dispatcher by ID
    getById: async (id) => {
      try {
        return await dispatchersAPI.getById(id);
      } catch (error) {
        console.error(`Failed to fetch dispatcher ${id}:`, error);
        throw error;
      }
    },

    // Create new dispatcher
    create: async (dispatcherData) => {
      try {
        return await dispatchersAPI.create(dispatcherData);
      } catch (error) {
        console.error('Failed to create dispatcher:', error);
        throw error;
      }
    },

    // Update dispatcher
    update: async (dispatcherData) => {
      try {
        return await dispatchersAPI.update(dispatcherData);
      } catch (error) {
        console.error('Failed to update dispatcher:', error);
        throw error;
      }
    },

    // Fire dispatcher
    fire: async (dispatcherId) => {
      try {
        return await userAPI.fireDispatcher(dispatcherId);
      } catch (error) {
        console.error('Failed to fire dispatcher:', error);
        throw error;
      }
    }

  },

  // Drivers Management
  drivers: {
    // Get all active drivers (extended version)
    getActive: async () => {
      try {
        return await driversAPI.getActive();
      } catch (error) {
        console.error('Failed to fetch active drivers:', error);
      }
    },

    // Get all drivers (extended version)
    getAll: async () => {
      try {
        return await driversAPI.getAll();
      } catch (error) {
        console.error('Failed to fetch active drivers:', error);
      }
    },

    // Get driver by ID
    getById: async (id) => {
      try {
        return await driversAPI.getById(id);
      } catch (error) {
        console.error(`Failed to fetch driver ${id}:`, error);
        throw error;
      }
    },

    // Create new driver
    create: async (driverData) => {
      try {
        return await driversAPI.create(driverData);
      } catch (error) {
        console.error('Failed to create driver:', error);
        throw error;
      }
    },

    // Update driver
    update: async (driverData) => {
      try {
        return await driversAPI.update(driverData);
      } catch (error) {
        console.error('Failed to update driver:', error);
        throw error;
      }
    },

    // Fire driver
    fire: async (driverId) => {
      try {
        return await userAPI.fireDriver(driverId);
      } catch (error) {
        console.error('Failed to fire driver:', error);
        throw error;
      }
    }

  },

  // Cars Management
  cars: {
    // Get cars by driver ID
    getByDriver: async (driverId) => {
      try {
        return await carsAPI.getByDriver(driverId);
      } catch (error) {
        console.error(`Failed to fetch cars for driver ${driverId}:`, error);
      }
    },

    // Create new car
    create: async (carData) => {
      try {
        return await carsAPI.create(carData);
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

  //User role checking

  user: {
    // Check if user has admin role
    isAdmin: async (userId) => {
      try {
        if (!userId) {
          throw new Error('UserId is required for role checking');
        }

        const response = await userAPI.isAdmin(userId);

        // The endpoint returns a boolean, so we return an object with isAdmin property
        return { isAdmin: response };
      } catch (error) {
        console.error('Failed to check user role:', error);
        // Return mock admin role for development
        return { isAdmin: false };
      }
    },

    // Get all fired workers (dispatchers and drivers)
    getFiredWorkers: async () => {
      try {
        return await userAPI.getFiredWorkers();
      } catch (error) {
        console.error('Failed to fetch fired workers:', error);
        throw error;
      }
    }
  }
};