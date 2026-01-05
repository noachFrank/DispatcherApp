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
      IS_ADMIN: '/api/User/isAdmin',
      FIRE_DRIVER: '/api/User/FireDriver',
      FIRE_DISPATCHER: '/api/User/FireDispatcher',
      GET_FIRED_WORKERS: '/api/User/GetFiredWorkers',
      UPDATE_PASSWORD: '/api/user/UpdatePassword',
      FORGOT_PASSWORD: '/api/user/ForgotPassword'
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
      CANCEL_RECURRING: '/api/Ride/CancelRecurring',
      REASSIGN: '/api/Ride/Reassign',
      PICKUP: '/api/Ride/Pickup',
      DROPOFF: '/api/Ride/Dropoff',
      UPDATE_STATUS: '/api/Ride/UpdateStatus',
      CALCULATE_PRICE: '/api/Ride/CalculatePrice',
      RESET_PICKUP: '/api/Ride/ResetPickupTime',
      UPDATE_PRICE: '/api/Ride/UpdatePrice',
      UNSETTLED_RIDES_BY_DRIVER: '/api/Ride/UnsettledRides',
      SETTLE_DRIVER: '/api/Ride/SettleDriver',
      SETTLE_RIDE: '/api/Ride/SettleRide'
    },
    DASHBOARD: {
      GET_ALL: '/api/Ride/Dashboard',
      ASSIGNED_RIDES: '/api/Ride/Dashboard/AssignedRides',
      OPEN_RIDES: '/api/Ride/Dashboard/OpenRides',
      RIDES_IN_PROGRESS: '/api/Ride/Dashboard/RidesInProgress',
      RECURRING_RIDES_THIS_WEEK: '/api/Ride/Dashboard/RecurringRidesThisWeek',
      TODAYS_RIDES: '/api/Ride/Dashboard/TodaysRides',
      ACTIVE_DRIVERS: '/api/User/Dashboard/ActiveDrivers',
      DRIVERS_ON_JOB: '/api/User/Dashboard/DriversOnJob',
      UNSETTLED_DRIVERS: '/api/Ride/Dashboard/UnsettledDrivers'
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

// Global reference to AuthContext's forceLogout function
let globalForceLogout = null;

export const setForceLogoutCallback = (callback) => {
  globalForceLogout = callback;
};

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
        hasToken: !!token,
        authorization: config.headers.Authorization,
        body: config.data
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

    // Log error details FIRST (persists in console even after redirect)
    console.error('=== API ERROR DETAILS ===');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('URL:', error.config?.url);
    console.error('Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    console.error('Response Data:', error.response?.data);
    console.error('Request Data:', error.config?.data);
    console.error('========================');

    // Don't try to refresh token on login endpoint (401 means invalid credentials)
    const isLoginEndpoint = error.config?.url?.includes('/login');

    // Handle 401 Unauthorized - token expired or invalid (but not on login page)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint) {
      originalRequest._retry = true;

      // Only try to refresh if we have a token
      const currentToken = tokenManager.getToken();
      if (!currentToken) {
        console.error('No token available - cannot refresh');
        // Force logout since we have no token
        if (globalForceLogout) {
          await globalForceLogout();
        }
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Try to refresh token
      try {
        const response = await axios.post(
          `${config.API_BASE_URL}${config.ENDPOINTS.AUTH.REFRESH}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${currentToken}`
            }
          }
        );

        if (response.data?.token) {
          tokenManager.setToken(response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear token and force logout
        console.error('Token refresh failed - logging out');
        tokenManager.removeToken();

        // Call forceLogout if available to update UI state
        if (globalForceLogout) {
          await globalForceLogout();
        }

        // Only redirect if NOT already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export the axios instance and config
export { apiClient };
export default config;