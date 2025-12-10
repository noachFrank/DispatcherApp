import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../config/googleMapsConfig';
import { Box, CircularProgress, Typography } from '@mui/material';

// Create a context to share Google Maps loading state
const GoogleMapsContext = createContext({
    isLoaded: false,
    loadError: null
});

// Custom hook to use Google Maps context
export const useGoogleMaps = () => useContext(GoogleMapsContext);

/**
 * GoogleMapsProvider
 * 
 * This component wraps your app and loads the Google Maps JavaScript API once.
 * All child components can then use Google Maps features.
 * 
 * Usage:
 * <GoogleMapsProvider>
 *   <App />
 * </GoogleMapsProvider>
 */
export const GoogleMapsProvider = ({ children }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Show error if API failed to load
    if (loadError) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="200px"
                p={3}
            >
                <Typography color="error" variant="h6" gutterBottom>
                    Failed to load Google Maps
                </Typography>
                <Typography color="text.secondary" variant="body2">
                    Please check your API key configuration in src/config/googleMapsConfig.js
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Error: {loadError.message}
                </Typography>
            </Box>
        );
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export default GoogleMapsProvider;
