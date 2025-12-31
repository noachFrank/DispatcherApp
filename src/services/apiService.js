import config, { apiClient, tokenManager } from '../config/apiConfig';

// Authentication API calls
export const authAPI = {
  login: async (userType, username, password) => {
    const response = await apiClient.post(config.ENDPOINTS.AUTH.LOGIN, {
      userType: userType,
      nameOrEmail: username,
      password: password
    });

    // Save JWT token if present in response
    if (response.data?.token) {
      tokenManager.setToken(response.data.token);
    }

    return response.data;
  },

  logout: async (userType, userId) => {
    const response = await apiClient.post(config.ENDPOINTS.AUTH.LOGOUT, {
      userType: userType,
      userId: userId
    });

    // Clear JWT token on logout
    tokenManager.removeToken();

    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post(config.ENDPOINTS.AUTH.REFRESH);

    // Update JWT token if present in response
    if (response.data?.token) {
      tokenManager.setToken(response.data.token);
    }

    return response.data;
  }
};

// Rides API
export const ridesAPI = {
  create: async (rideData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.CREATE, rideData);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_ALL);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_BY_ID, {
      params: { id }
    });
    return response.data;
  },

  getAssigned: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_ASSIGNED);
    return response.data;
  },

  getInProgress: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_IN_PROGRESS);
    return response.data;
  },

  getFuture: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_FUTURE);
    return response.data;
  },

  getToday: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_TODAY);
    return response.data;
  },

  getOpen: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_OPEN);
    return response.data;
  },

  getThisWeek: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_THIS_WEEK);
    return response.data;
  },

  getAllHistory: async () => {
    const response = await apiClient.get(config.ENDPOINTS.RIDES.GET_ALL_HISTORY);
    return response.data;
  },

  update: async (id, rideData) => {
    const response = await apiClient.put(`${config.ENDPOINTS.RIDES.UPDATE}/${id}`, rideData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${config.ENDPOINTS.RIDES.DELETE}/${id}`);
    return response.data;
  },

  assign: async (assignData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.ASSIGN, assignData);
    return response.data;
  },

  cancel: async (cancelData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.CANCEL, cancelData);
    return response.data;
  },

  cancelRecurring: async (rideId) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.CANCEL_RECURRING, rideId);
    return response.data;
  },

  reassign: async (reassignData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.REASSIGN, reassignData);
    return response.data;
  },

  pickup: async (pickupData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.PICKUP, pickupData);
    return response.data;
  },

  dropoff: async (dropoffData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.DROPOFF, dropoffData);
    return response.data;
  },

  updateStatus: async (statusData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.UPDATE_STATUS, statusData);
    return response.data;
  },

  calculatePrice: async (priceRequest) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.CALCULATE_PRICE, priceRequest);
    return response.data;
  },
  resetPickup: async (resetData) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.RESET_PICKUP, resetData);
    return response.data;
  },
  updatePrice: async (rideId, amount, driversComp) => {
    const response = await apiClient.post(config.ENDPOINTS.RIDES.UPDATE_PRICE, {
      RideId: rideId,
      Amount: amount,
      DriversComp: driversComp
    });
    return response.data;
  }
};

// Drivers API
export const driversAPI = {
  getAll: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_ALL);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${config.ENDPOINTS.DRIVERS.GET_BY_ID}?id=${id}`);
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_ACTIVE);
    return response.data;
  },

  getDriving: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_DRIVING);
    return response.data;
  },

  getDriversDriving: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_DRIVERS_DRIVING);
    return response.data;
  },

  getOnlineDrivers: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_ONLINE_DRIVERS);
    return response.data;
  },

  create: async (driverData) => {
    const response = await apiClient.post(config.ENDPOINTS.DRIVERS.CREATE, driverData);
    return response.data;
  },

  update: async (driverData) => {
    const response = await apiClient.post(config.ENDPOINTS.DRIVERS.UPDATE, driverData);
    return response.data;
  },

  getDriverStatus: async (driverId) => {
    const response = await apiClient.get(config.ENDPOINTS.DRIVERS.GET_DRIVER_STATUS, {
      params: { userId: driverId }
    });
    return response.data;
  },

  updateStatus: async (driverId, status) => {
    const response = await apiClient.put(config.ENDPOINTS.DRIVERS.UPDATE_STATUS, {
      driverId,
      status
    });
    return response.data;
  }
};

// Dispatchers API
export const dispatchersAPI = {
  getActive: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DISPATCHERS.GET_ACTIVE);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${config.ENDPOINTS.DISPATCHERS.GET_BY_ID}/${id}`);
    return response.data;
  },

  create: async (dispatcherData) => {
    const response = await apiClient.post(config.ENDPOINTS.DISPATCHERS.CREATE, dispatcherData);
    return response.data;
  },

  update: async (dispatcherData) => {
    const response = await apiClient.post(config.ENDPOINTS.DISPATCHERS.UPDATE, dispatcherData);
    return response.data;
  },

};

// Cars API
export const carsAPI = {
  getByDriver: async (driverId) => {
    const response = await apiClient.get(`${config.ENDPOINTS.CARS.GET_BY_DRIVER}?userId=${driverId}`);
    return response.data;
  },

  create: async (carData) => {
    const response = await apiClient.post(config.ENDPOINTS.CARS.CREATE, carData);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  send: async (messageData) => {
    const response = await apiClient.post(config.ENDPOINTS.MESSAGES.SEND_MESSAGE, messageData);
    return response.data;
  },

  getTodayMessages: async (driverId) => {
    const url = driverId
      ? `${config.ENDPOINTS.MESSAGES.GET_TODAY_MESSAGES}?driverId=${driverId}`
      : config.ENDPOINTS.MESSAGES.GET_TODAY_MESSAGES;
    const response = await apiClient.get(url);
    return response.data;
  },

  getAllMessages: async (driverId) => {
    const response = await apiClient.get(`${config.ENDPOINTS.MESSAGES.GET_ALL_MESSAGES}?driverId=${driverId}`);
    return response.data;
  },

  getBroadcastMessages: async () => {
    const response = await apiClient.get(config.ENDPOINTS.MESSAGES.GET_BROADCAST_MESSAGES);
    return response.data;
  },

  getUnread: async () => {
    const response = await apiClient.get(config.ENDPOINTS.MESSAGES.GET_UNREAD);
    return response.data;
  },

  markAsRead: async (messageIds) => {
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
    const response = await apiClient.post(config.ENDPOINTS.MESSAGES.MARK_READ, ids);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get(config.ENDPOINTS.MESSAGES.GET_UNREAD_COUNT);
    return response.data;
  }
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get(config.ENDPOINTS.USER.GET_PROFILE);
    return response.data;
  },

  isAdmin: async (userId) => {
    const response = await apiClient.get(config.ENDPOINTS.USER.IS_ADMIN, {
      params: { userId }
    });
    return response.data;
  },

  fireDriver: async (driverId) => {
    const response = await apiClient.post(config.ENDPOINTS.USER.FIRE_DRIVER, driverId, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  fireDispatcher: async (dispatcherId) => {
    const response = await apiClient.post(config.ENDPOINTS.USER.FIRE_DISPATCHER, dispatcherId, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  getFiredWorkers: async () => {
    const response = await apiClient.get(config.ENDPOINTS.USER.GET_FIRED_WORKERS);
    return response.data;
  },

  updatePassword: async (userId, oldPassword, newPassword) => {
    const response = await apiClient.post(config.ENDPOINTS.USER.UPDATE_PASSWORD, {
      userId,
      userType: 'dispatcher',
      oldPassword,
      newPassword
    });
    return response.data;
  },

  forgotPassword: async (userId, userType = 'dispatcher') => {
    const response = await apiClient.post(config.ENDPOINTS.USER.FORGOT_PASSWORD, {
      userId,
      userType
    });
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  getAll: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.GET_ALL);
    return response.data;
  },

  getAssignedRides: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.ASSIGNED_RIDES);
    return response.data;
  },

  getOpenRides: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.OPEN_RIDES);
    return response.data;
  },

  getRidesInProgress: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.RIDES_IN_PROGRESS);
    return response.data;
  },

  getRecurringRidesThisWeek: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.RECURRING_RIDES_THIS_WEEK);
    return response.data;
  },

  getTodaysRides: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.TODAYS_RIDES);
    return response.data;
  },

  getActiveDrivers: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.ACTIVE_DRIVERS);
    return response.data;
  },

  getDriversOnJob: async () => {
    const response = await apiClient.get(config.ENDPOINTS.DASHBOARD.DRIVERS_ON_JOB);
    return response.data;
  }
};

// Export token manager for use in other modules
export { tokenManager };