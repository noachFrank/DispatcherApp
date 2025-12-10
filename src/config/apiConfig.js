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
      CHECK_ROLE: '/api/User/checkRole'
    },
    // CALLS: {
    //   CREATE: '/api/calls',
    //   GET_ALL: '/api/calls',
    //   GET_BY_ID: '/api/calls',
    //   UPDATE: '/api/calls',
    //   DELETE: '/api/calls'
    //},
    RIDES: {
      CREATE: '/api/Ride/AddRide',
      GET_ALL: '/api/Ride/Open',
      GET_BY_ID: '/api/Ride/GetById',
      GET_ASSIGNED: '/api/Ride/AssignedRides',
      GET_IN_PROGRESS: '/api/Ride/CurrentlyBeingDriven',
      GET_FUTURE: '/api/Ride/FutureRides',
      GET_TODAY: '/api/Ride/TodaysRides',
      UPDATE: '/api/rides',
      DELETE: '/api/rides',
      ASSIGN: '/api/Ride/AssignToDriver',
      CANCEL: '/api/Ride/Cancel',
      REASSIGN: '/api/Ride/Reassign',
      PICKUP: '/api/Ride/Pickup',
      DROPOFF: '/api/Ride/Dropoff',
      UPDATE_STATUS: '/api/Ride/UpdateStatus'
    },
    // ROUTES: {
    //   CREATE: '/api/Ride/AddRide',
    //   GET_ALL: '/api/routes',
    //   GET_BY_ID: '/api/routes',
    //   UPDATE: '/api/routes',
    //   DELETE: '/api/routes'
    // },
    DRIVERS: {
      GET_ALL: '/api/User/AllDrivers',
      GET_BY_ID: '/api/User/DriverById',
      //GET_AVAILABLE: '/api/User/ActiveDrivers',
      GET_ACTIVE: '/api/User/ActiveDrivers',
      GET_DRIVING: '/api/User/ActiveDriversOnCall',
      CREATE: '/api/User/AddDriver',
      UPDATE: '/api/User/UpdateDriver',
      DELETE: '/api/User/DeleteDriver',
      UPDATE_STATUS: '/api/drivers/status'
    },
    DISPATCHERS: {
      GET_ACTIVE: '/api/User/ActiveDispatchers',
      GET_BY_ID: '/api/User/DispatcherById',
      CREATE: '/api/User/AddDispatcher',
      UPDATE: '/api/User/UpdateDispatcher',
      DELETE: '/api/User/DeleteDispatcher'
    },
    CARS: {
      GET_BY_DRIVER: '/api/User/CarsByDriver',
      CREATE: '/api/User/AddCar',
      UPDATE: '/api/User/UpdateCar',
      DELETE: '/api/User/DeleteCar'
    },
    MESSAGES: {
      SEND_MESSAGE: '/api/Communication/AddCom', 
      GET_TODAY_MESSAGES: '/api/Communication/TodaysCom',
      GET_ALL_MESSAGES: '/api/Communication/AllCom',
      MARK_READ: '/api/Communication/MarkAsRead',
      GET_UNREAD_COUNT: '/api/messages/unreadCount'
    },
    // DRIVER_CALLS: {
    //   ASSIGN_TO_DRIVER: '/api/calls/assign',
    //   UPDATE_STATUS: '/api/calls/status',
    //   CANCEL_CALL: '/api/calls/cancel',
    //   REASSIGN_CALL: '/api/calls/reassign'
    // }
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Default headers for API requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};

// Helper function to make API requests with consistent configuration
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions = {
    timeout: config.TIMEOUT,
    headers: {
      ...config.DEFAULT_HEADERS,
      ...options.headers
    }
  };

  const requestOptions = {
    ...defaultOptions,
    ...options
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);

    // console.log('Making API request to:', url);
    // console.log('Request method:', requestOptions.method || 'GET');
    //console.log('Request headers:', requestOptions.headers);
    // console.log('Request body:', requestOptions.body);
    
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal
    });
    
    console.log('Response status:', response.status, response.url);
   // console.log('Response headers:', Object.fromEntries(response.headers));

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        errorMessage += ` - ${errorBody}`;
      } catch (e) {
        // If we can't read the error body, just use the status
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    console.error('API request failed:', {
      url,
      method: requestOptions.method || 'GET',
      headers: requestOptions.headers,
      body: requestOptions.body,
      error: error.message
    });
    throw error;
  }
};

// Export the config for direct access
export default config;