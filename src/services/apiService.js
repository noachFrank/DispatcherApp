import config, { apiRequest } from '../config/apiConfig';

// Authentication API calls
export const authAPI = {
  login: async (userType, username, password) => {
    return apiRequest(config.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ 
        userType: userType,
        userName: username,  
        password: password 
      })
    });
  },

  logout: async (userType, userId) => {
    return apiRequest(config.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ 
        userType: userType,
        userId: userId 
      })
    });
  },

  refreshToken: async () => {
    return apiRequest(config.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST'
    });
  }
};

// Calls API
export const callsAPI = {
  create: async (callData) => {
    return apiRequest(config.ENDPOINTS.CALLS.CREATE, {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  },

  getAll: async () => {
    return apiRequest(config.ENDPOINTS.CALLS.GET_ALL, {
      method: 'GET'
    });
  },

  getById: async (id) => {
    return apiRequest(`${config.ENDPOINTS.CALLS.GET_BY_ID}/${id}`, {
      method: 'GET'
    });
  },

  update: async (id, callData) => {
    return apiRequest(`${config.ENDPOINTS.CALLS.UPDATE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(callData)
    });
  },

  delete: async (id) => {
    return apiRequest(`${config.ENDPOINTS.CALLS.DELETE}/${id}`, {
      method: 'DELETE'
    });
  }
};

// Drivers API
export const driversAPI = {
  getAll: async () => {
    return apiRequest(config.ENDPOINTS.DRIVERS.GET_ALL, {
      method: 'GET'
    });
  },

  getAvailable: async () => {
    return apiRequest(config.ENDPOINTS.DRIVERS.GET_AVAILABLE, {
      method: 'GET'
    });
  },

  updateStatus: async (driverId, status) => {
    return apiRequest(config.ENDPOINTS.DRIVERS.UPDATE_STATUS, {
      method: 'PUT',
      body: JSON.stringify({ driverId, status })
    });
  }
};

// Helper function to add authorization header to requests
export const addAuthHeader = (token) => {
  return {
    'Authorization': `Bearer ${token}`
  };
};