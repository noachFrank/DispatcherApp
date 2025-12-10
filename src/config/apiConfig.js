import axios from 'axios';
import environmentConfig from './environment';

// API Configuration
const config = {
  // Base API URL - automatically determined by environment
  API_BASE_URL: environmentConfig.API_BASE_URL,

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/user/login',
      LOGOUT: '/api/user/logout',
      REFRESH: '/api/user/refresh'
    },
    USER: {
      GET_PROFILE: '/api/user/profile',
      IS_ADMIN: '/api/User/isAdmin'
    },
    RIDES: {
      CREATE: '/api/Ride/AddRide',
      GET_ALL: '/api/Ride/Open',
      GET_BY_ID: '/api/Ride/GetById',
      GET_ASSIGNED: '/api/Ride/AssignedRides',
      GET_IN_PROGRESS: '/api/Ride/CurrentlyBeingDriven',
      GET_FUTURE: '/api/Ride/FutureRides',
      GET_TODAY: '/api/Ride/TodaysRides',
      GET_OPEN: '/api/Ride/Open',
      GET_THIS_WEEK: '/api/Ride/RidesThisWeek',
      GET_ALL_HISTORY: '/api/Ride/AllRides',
      UPDATE: '/api/rides',
      // DELETE: '/api/rides',
      ASSIGN: '/api/Ride/AssignToDriver',
      CANCEL: '/api/Ride/CancelRide',
      REASSIGN: '/api/Ride/Reassign',
      PICKUP: '/api/Ride/Pickup',
      DROPOFF: '/api/Ride/Dropoff',
      UPDATE_STATUS: '/api/Ride/UpdateStatus'
    },
    DRIVERS: {
      GET_ALL: '/api/User/AllDrivers',
      GET_BY_ID: '/api/User/DriverById',
      GET_ACTIVE: '/api/User/ActiveDrivers',
      GET_DRIVING: '/api/User/ActiveDriversOnCall',
      GET_DRIVERS_DRIVING: '/api/User/getDriversDriving',
      GET_ONLINE_DRIVERS: '/api/User/getOnlineDrivers',
      CREATE: '/api/User/AddDriver',
      UPDATE: '/api/User/UpdateDriver',
      GET_DRIVER_STATUS: '/api/User/getDriverStatus',
    },
    DISPATCHERS: {
      GET_ACTIVE: '/api/User/ActiveDispatchers',
      GET_BY_ID: '/api/User/DispatcherById',
      CREATE: '/api/User/AddDispatcher',
      UPDATE: '/api/User/UpdateDispatcher',
    },
    CARS: {
      GET_BY_DRIVER: '/api/User/getCars',
      CREATE: '/api/User/AddCar',
      // UPDATE: '/api/User/UpdateCar',
    },
    MESSAGES: {
      SEND_MESSAGE: '/api/Communication/AddCom',
      GET_TODAY_MESSAGES: '/api/Communication/TodaysCom',
      GET_ALL_MESSAGES: '/api/Communication/AllCom',
      GET_BROADCAST_MESSAGES: '/api/Communication/BroadcastComs',
      GET_UNREAD_COUNT: '/api/Communication/driverUnreadCount',
      MARK_READ: '/api/Communication/MarkAsRead',
      // GET_UNREAD_COUNT: '/api/messages/unreadCount',
      GET_UNREAD: '/api/Communication/Unread',

    }
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// JWT Token Management
const TOKEN_KEY = 'dispatch_jwt_token';

export const tokenManager = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

// Request interceptor - adds JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request details in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const response = await axios.post(
          `${config.API_BASE_URL}${config.ENDPOINTS.AUTH.REFRESH}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenManager.getToken()}`
            }
          }
        );

        if (response.data?.token) {
          tokenManager.setToken(response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        tokenManager.removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Log error details
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

// Export the axios instance and config
export { apiClient };
export default config;