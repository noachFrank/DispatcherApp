/**
 * Google Maps Route Calculator Service
 * 
 * This service calculates driving distance and duration between addresses
 * using the Google Maps Directions API.
 */

/**
 * Calculate route details between multiple addresses
 * 
 * @param {string} origin - Starting address
 * @param {string} destination - Ending address
 * @param {string[]} waypoints - Array of stop addresses (optional)
 * @param {boolean} roundTrip - If true, adds origin as final destination
 * @returns {Promise<{distance: number, duration: number, durationText: string, distanceText: string}>}
 */
export const calculateRoute = async (origin, destination, waypoints = [], roundTrip = false) => {
    return new Promise((resolve, reject) => {
        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
            reject(new Error('Google Maps not loaded'));
            return;
        }

        // Need at least origin and destination
        if (!origin || !destination) {
            resolve({
                distance: 0,
                duration: 0,
                distanceText: '',
                durationText: '',
                error: 'Origin and destination are required'
            });
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        // Build waypoints array for Google API
        const googleWaypoints = waypoints
            .filter(wp => wp && wp.trim() !== '')
            .map(wp => ({
                location: wp,
                stopover: true
            }));

        // If round trip, destination stays the same but we add original destination as waypoint
        // and set final destination back to origin
        let finalDestination = destination;
        if (roundTrip) {
            if (destination !== origin) {
                googleWaypoints.push({
                    location: destination,
                    stopover: true
                });
            }
            finalDestination = origin;
        }

        const request = {
            origin: origin,
            destination: finalDestination,
            waypoints: googleWaypoints,
            optimizeWaypoints: false, // Keep stops in order
            travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                // Calculate total distance and duration from all legs
                let totalDistance = 0; // in meters
                let totalDuration = 0; // in seconds

                result.routes[0].legs.forEach(leg => {
                    totalDistance += leg.distance.value;
                    totalDuration += leg.duration.value;
                });

                // Convert to miles and minutes
                const distanceMiles = totalDistance / 1609.34; // meters to miles
                const durationMinutes = Math.ceil(totalDuration / 60); // seconds to minutes

                resolve({
                    distance: distanceMiles,
                    duration: durationMinutes,
                    distanceText: `${distanceMiles.toFixed(1)} miles`,
                    durationText: formatDuration(durationMinutes),
                    route: result.routes[0],
                    legs: result.routes[0].legs
                });
            } else {
                // Don't log expected errors like ZERO_RESULTS or NOT_FOUND
                // These happen when addresses are incomplete or not found
                resolve({
                    distance: 0,
                    duration: 0,
                    distanceText: '',
                    durationText: '',
                    error: `Could not calculate route: ${status}`
                });
            }
        });
    });
};

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1 hr 30 min")
 */
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
};

/**
 * Get coordinates from an address (geocoding)
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const geocodeAddress = async (address) => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            reject(new Error('Google Maps not loaded'));
            return;
        }

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ address: address }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
                resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                    formattedAddress: results[0].formatted_address
                });
            } else {
                reject(new Error(`Geocoding failed: ${status}`));
            }
        });
    });
};

export default { calculateRoute, geocodeAddress };
