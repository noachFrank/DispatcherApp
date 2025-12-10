// Alternative API test formats to help debug your API
import config from './apiConfig';

export const testDifferentLoginFormats = async (username, password) => {
  const baseUrl = `${config.API_BASE_URL}${config.ENDPOINTS.AUTH.LOGIN}`;
  
  // Format 1: Current format
  console.log('\n=== Testing Format 1: Current format ===');
  await testLoginFormat(baseUrl, {
    userType: 'dispatcher',
    userName: username,
    password: password
  });
  
  // Format 2: Different casing
  console.log('\n=== Testing Format 2: Different casing ===');
  await testLoginFormat(baseUrl, {
    UserType: 'dispatcher',
    UserName: username,
    Password: password
  });
  
  // Format 3: Simple format
  console.log('\n=== Testing Format 3: Simple format ===');
  await testLoginFormat(baseUrl, {
    username: username,
    password: password
  });
  
  // Format 4: With email field
  console.log('\n=== Testing Format 4: Email format ===');
  await testLoginFormat(baseUrl, {
    email: username,
    password: password,
    userType: 'dispatcher'
  });
  
  // Format 5: Form data instead of JSON
  console.log('\n=== Testing Format 5: Form data ===');
  await testLoginAsFormData(baseUrl, {
    userType: 'dispatcher',
    userName: username,
    password: password
  });
};

const testLoginFormat = async (url, payload) => {
  try {
    console.log('Testing payload:', payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS with this format!');
      return JSON.parse(responseText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

const testLoginAsFormData = async (url, payload) => {
  try {
    console.log('Testing form data payload:', payload);
    
    const formData = new FormData();
    Object.keys(payload).forEach(key => {
      formData.append(key, payload[key]);
    });
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    console.log('Status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS with form data format!');
      return JSON.parse(responseText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testLoginFormats = testDifferentLoginFormats;
}