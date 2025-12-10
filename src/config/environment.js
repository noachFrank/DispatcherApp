// Environment-specific configuration
const environments = {
  development: {
    API_BASE_URL: 'https://localhost:7170',
    DEBUG: true
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com', // Replace with your production URL
    DEBUG: false
  }
};

// Determine current environment
const getCurrentEnvironment = () => {
  console.log(import.meta.env);
  return import.meta.env.MODE || 'development';
};

// Get environment-specific config
export const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment();
  return environments[currentEnv] || environments.development;
};

// Export for direct use
export default getEnvironmentConfig();