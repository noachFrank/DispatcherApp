// Environment-specific configuration
// URLs are loaded from environment variables (.env file)
// See .env.example for the template

const environments = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL_DEV || 'https://localhost:7170',
    SIGNALR_HUB_URL: import.meta.env.VITE_SIGNALR_HUB_URL_DEV || 'http://localhost:5062/hubs/dispatch',
    DEBUG: true
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL_PROD || '',
    SIGNALR_HUB_URL: import.meta.env.VITE_SIGNALR_HUB_URL_PROD || '',
    DEBUG: false
  }
};

// Determine current environment
const getCurrentEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Get environment-specific config
export const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment();
  return environments[currentEnv] || environments.development;
};

// Export for direct use
export default getEnvironmentConfig();