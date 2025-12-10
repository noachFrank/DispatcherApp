// Simple API debugging tool
export const debugLogin = async () => {
  console.log('🔍 Starting API Debug...');
  
  // Test 1: Check if API is reachable
  console.log('\n=== Test 1: API Health Check ===');
  try {
    const healthResponse = await fetch('https://localhost:7170/swagger/index.html');
    console.log('✅ API is reachable. Status:', healthResponse.status);
  } catch (error) {
    console.log('❌ API not reachable:', error.message);
    return;
  }

  // Test 2: Try OPTIONS request to check CORS
  console.log('\n=== Test 2: CORS Check ===');
  try {
    const corsResponse = await fetch('https://localhost:7170/api/user/login', {
      method: 'OPTIONS'
    });
    console.log('CORS OPTIONS status:', corsResponse.status);
    console.log('CORS headers:', Object.fromEntries(corsResponse.headers));
  } catch (error) {
    console.log('CORS check failed:', error.message);
  }

  // Test 3: Try different login formats
  const formats = [
    {
      name: 'Current Format (PascalCase)',
      data: { UserType: 'dispatcher', UserName: 'NFrank', Password: '123' }
    },
    {
      name: 'camelCase Format',
      data: { userType: 'dispatcher', userName: 'NFrank', password: '123' }
    },
    {
      name: 'Simple Format',
      data: { username: 'NFrank', password: '123' }
    },
    {
      name: 'Email Format',
      data: { email: 'NFrank', password: '123', userType: 'dispatcher' }
    }
  ];

  for (const format of formats) {
    console.log(`\n=== Test 3.${formats.indexOf(format) + 1}: ${format.name} ===`);
    await testLoginFormat(format.data);
  }
};

const testLoginFormat = async (payload) => {
  try {
    console.log('📤 Sending:', JSON.stringify(payload));
    
    const response = await fetch('https://localhost:7170/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response Status:', response.status);
    
    // Try to read response body
    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);

    if (response.ok) {
      console.log('🎉 SUCCESS! This format works!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Parsed response:', jsonResponse);
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    } else {
      console.log('❌ Failed with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.debugLogin = debugLogin;
}