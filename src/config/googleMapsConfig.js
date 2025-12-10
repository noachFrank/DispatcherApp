// Google Maps Configuration
// 
// HOW TO GET YOUR API KEY:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable these APIs:
//    - Maps JavaScript API
//    - Places API
//    - Directions API
//    - Geocoding API
// 4. Go to Credentials → Create API Key
// 5. Copy the key and paste it below
// 6. IMPORTANT: Set up billing (you get $200 free monthly credit)

// Replace this with your actual Google Maps API key
export const PROD_API_KEY = 'AIzaSyDazdrhKGIatao6AWpveHph0TPPuZexSQg';

const DEV_API_KEY = 'AIzaSyB4oZD9v6F-9KZGRyyt4mS1IuBayV3x3CU';
// Use this flag to switch between dev key and production key   
const USE_DEV_KEY = true;

export const GOOGLE_MAPS_API_KEY = USE_DEV_KEY ? DEV_API_KEY : PROD_API_KEY;

// Libraries needed for different features
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

// Default map center (Lakewood, NJ - Zip 08701)
export const DEFAULT_MAP_CENTER = {
    lat: 40.0960,
    lng: -74.2177
};

// Default map zoom level
export const DEFAULT_MAP_ZOOM = 13;

// Autocomplete options for address search
export const AUTOCOMPLETE_OPTIONS = {
    componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada
    fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
    types: ['address'] // Only show addresses (not businesses)
};
