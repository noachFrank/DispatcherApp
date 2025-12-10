// Debug helper for API testing
import config from './apiConfig';

export const testAPIConnection = async () => {
  console.log('Testing API connection to:', config.API_BASE_URL);
  
  try {
    // Test if the API is reachable
    const response = await fetch(config.API_BASE_URL);
    console.log('API Health Check:', response.status, response.statusText);
  } catch (error) {
    console.error('API not reachable:', error);
  }
};

export const testLoginEndpoint = async (userType, username, password) => {
  console.log('Testing login endpoint with payload:', { userType, userName: username, password: '[HIDDEN]' });
  
  const url = `${config.API_BASE_URL}${config.ENDPOINTS.AUTH.LOGIN}`;
  console.log('Login URL:', url);
  
  const payload = { userType, userName: username, password };
  console.log('Request payload:', { ...payload, password: '[HIDDEN]' });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: config.DEFAULT_HEADERS,
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      return JSON.parse(responseText);
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
  } catch (error) {
    console.error('Login test failed:', error);
    throw error;
  }
};

// Call this from browser console to test your API
window.testAPI = {
  testConnection: testAPIConnection,
  testLogin: testLoginEndpoint
};