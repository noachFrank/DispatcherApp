// Google Maps Configuration
// 
// API keys are loaded from environment variables (.env file)
// See .env.example for the template
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
// 5. Add the key to your .env file
// 6. IMPORTANT: Set up billing (you get $200 free monthly credit)

// API keys loaded from environment variables
export const PROD_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEV_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY_DEV || '';
const USE_DEV_KEY = import.meta.env.VITE_USE_DEV_MAPS_KEY === 'true';

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
    fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
    // types removed to allow addresses, businesses, airports, and all POIs
};
