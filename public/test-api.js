// Simple API endpoint tester
// Open browser console and run: testCommEndpoint(1)

window.testCommEndpoint = async (driverId) => {
  const baseUrl = 'https://localhost:7170';
  const endpoint = `/api/Communication/TodaysCom?driverId=${driverId}`;
  const fullUrl = `${baseUrl}${endpoint}`;
  
  console.log('🔍 Testing Communication endpoint:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status, response.statusText);
    console.log('📋 Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Data:', data);
      return data;
    } else if (response.status === 404) {
      console.log('❌ 404 Not Found - Possible issues:');
      console.log('   • Communication controller not registered');
      console.log('   • Route prefix mismatch');
      console.log('   • Method name case sensitivity');
      console.log('   • API not running on this URL');
      
      // Try alternative endpoints
      console.log('\n🔄 Trying alternative endpoints...');
      
      const alternatives = [
        '/api/communication/TodaysCom',  // lowercase controller
        '/api/Communication/todayscom',   // lowercase method
        '/api/Communication/GetTodaysCom', // with Get prefix
        '/api/Communications/TodaysCom'   // plural controller
      ];
      
      for (const alt of alternatives) {
        try {
          const altUrl = `${baseUrl}${alt}?driverId=${driverId}`;
          console.log(`   Trying: ${altUrl}`);
          const altResponse = await fetch(altUrl, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log(`   ✅ SUCCESS with ${alt}:`, altData);
            return altData;
          }
        } catch (e) {
          // Continue to next alternative
        }
      }
      
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    } else {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}:`, errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('   • Check if backend is running');
    console.log('   • Verify HTTPS certificate');
    console.log('   • Check CORS configuration');
  }
};

console.log('💡 Test function loaded! Run: testCommEndpoint(1)');