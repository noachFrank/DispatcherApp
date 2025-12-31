import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Drawer,
    IconButton,
    Divider,
    Chip,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Collapse,
    ListItemButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    DirectionsCar as CarIcon,
    Route as RouteIcon,
    Schedule as ScheduleIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    Notes as NotesIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Circle as CircleIcon,
    EventNote as EventNoteIcon,
    SignalWifiOff as OfflineIcon,
    SignalWifi4Bar as OnlineIcon,
    PlayArrow as PickupTimeIcon,
    Timer as DurationIcon,
    EventAvailable as ScheduledIcon,
    Place as PlaceIcon,
    FlagOutlined as DropoffIcon,
    MultipleStop as StopsIcon
} from '@mui/icons-material';
import { useGoogleMaps } from './GoogleMapsProvider';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../config/googleMapsConfig';
import { driversAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

// Map container style
const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 200px)',
    minHeight: '500px'
};

// Map options - gestureHandling: 'greedy' allows user to pan/zoom without ctrl key
const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
};

// Driver marker icon (car icon) - blue for driving online, gray for driving offline
const getDrivingDriverIcon = (isOnline) => ({
    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    fillColor: isOnline ? '#1976d2' : '#9e9e9e',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 1.5,
    anchor: { x: 12, y: 12 }
});

// Available driver marker - green
const getAvailableDriverIcon = () => ({
    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    fillColor: '#4caf50',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 1.5,
    anchor: { x: 12, y: 12 }
});

/**
 * DriverTracking Component
 * 
 * Displays a Google Map showing real-time driver locations.
 * - Shows drivers with active rides (even if offline) in blue/gray
 * - Shows online/available drivers (no active ride) in green
 * - Click on driver to open side panel with details and upcoming calls
 * - Map only moves when user interacts with it (not auto-centering)
 */
const DriverTracking = ({ isAdmin = false }) => {
    const { isLoaded, loadError } = useGoogleMaps();
    const { signalRConnection } = useAuth();
    const [map, setMap] = useState(null);
    const [drivingDrivers, setDrivingDrivers] = useState([]);
    const [onlineDrivers, setOnlineDrivers] = useState([]);
    const [driverLocations, setDriverLocations] = useState({});
    const [hoveredDriver, setHoveredDriver] = useState(null);
    const [sidePanelOpen, setSidePanelOpen] = useState(false);
    const [sidePanelDriver, setSidePanelDriver] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [upcomingCallsExpanded, setUpcomingCallsExpanded] = useState(true);

    // Store initial center - map won't auto-recenter after first load
    const initialCenter = useRef(DEFAULT_MAP_CENTER);
    const mapRef = useRef(null);
    // Store selected driver ID to keep panel open on refresh
    const selectedDriverIdRef = useRef(null);

    // Load drivers on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch driving and online drivers in parallel
                const [drivingData, onlineData] = await Promise.all([
                    driversAPI.getDriversDriving().catch(() => []),
                    driversAPI.getOnlineDrivers().catch(() => [])
                ]);

                console.log('🚗 Driving drivers:', drivingData?.length || 0, drivingData);
                console.log('🟢 Online/Available drivers:', onlineData?.length || 0, onlineData);

                // Deduplicate driving drivers by ID (in case API returns duplicates)
                const uniqueDrivingDrivers = [];
                const seenDrivingIds = new Set();
                (drivingData || []).forEach(driver => {
                    const id = driver.driver?.id || driver.driverId || driver.id;
                    if (id && !seenDrivingIds.has(id)) {
                        seenDrivingIds.add(id);
                        uniqueDrivingDrivers.push(driver);
                    }
                });

                setDrivingDrivers(uniqueDrivingDrivers);
                setOnlineDrivers(onlineData || []);

                // If a driver panel is open, update it with fresh data
                if (selectedDriverIdRef.current) {
                    const allDrivers = [...(drivingData || []), ...(onlineData || [])];
                    const updatedDriver = allDrivers.find(d =>
                        (d.driver?.id || d.driverId || d.id) === selectedDriverIdRef.current
                    );
                    if (updatedDriver) {
                        setSidePanelDriver(prev => ({
                            ...updatedDriver,
                            isAvailable: prev?.isAvailable ?? !(drivingData || []).some(d =>
                                (d.driver?.id || d.driverId || d.id) === selectedDriverIdRef.current
                            )
                        }));
                    }
                }

                // Also try to get any existing locations from SignalR
                if (signalRConnection) {
                    try {
                        console.log('📡 Fetching driver locations from SignalR...');
                        const locations = await signalRConnection.invoke('GetAllDriverLocations');
                        console.log('📍 Got driver locations:', locations);
                        const locationsMap = {};
                        (locations || []).forEach(loc => {
                            locationsMap[loc.driverId] = loc;
                        });
                        setDriverLocations(locationsMap);
                    } catch (err) {
                        console.log('Could not fetch initial locations:', err);
                    }
                } else {
                    console.log('⚠️ SignalR connection not available for location tracking');
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                // Only set loading to false on initial load, not on refreshes
                if (initialLoading) {
                    setInitialLoading(false);
                }
            }
        };

        loadData();

        // Refresh data every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [signalRConnection]);

    // Subscribe to SignalR location updates and ride status changes
    useEffect(() => {
        if (!signalRConnection) return;

        // Refetch driver lists when needed
        const refreshDriverLists = async () => {
            console.log('🔄 Refreshing driver lists...');
            try {
                const [drivingData, onlineData] = await Promise.all([
                    driversAPI.getDriversDriving().catch(() => []),
                    driversAPI.getOnlineDrivers().catch(() => [])
                ]);

                // Deduplicate driving drivers by ID (in case API returns duplicates)
                const uniqueDrivingDrivers = [];
                const seenDrivingIds = new Set();
                (drivingData || []).forEach(driver => {
                    const id = driver.driver?.id || driver.driverId || driver.id;
                    if (id && !seenDrivingIds.has(id)) {
                        seenDrivingIds.add(id);
                        uniqueDrivingDrivers.push(driver);
                    }
                });

                setDrivingDrivers(uniqueDrivingDrivers);
                setOnlineDrivers(onlineData || []);
            } catch (err) {
                console.error('Failed to refresh driver lists:', err);
            }
        };

        const handleLocationUpdated = (location) => {
            console.log('📍 Driver location updated:', location);
            setDriverLocations(prev => ({
                ...prev,
                [location.driverId]: location
            }));
        };

        const handleLocationRemoved = (driverId) => {
            console.log('📍 Driver location removed:', driverId);
            setDriverLocations(prev => {
                const newLocations = { ...prev };
                delete newLocations[driverId];
                return newLocations;
            });
        };

        // When a call is updated (assigned, completed, etc.), refresh the driver lists
        const handleCallUpdated = (data) => {
            console.log('📞 Call updated, refreshing drivers:', data);
            refreshDriverLists();
        };

        // When a call is assigned to a driver
        const handleCallAssigned = (data) => {
            console.log('📞 Call assigned, refreshing drivers:', data);
            refreshDriverLists();
        };

        // When a ride is completed (dropoff clicked)
        const handleRideCompleted = (data) => {
            console.log('✅ Ride completed, refreshing drivers:', data);
            refreshDriverLists();
        };

        // Subscribe to location events
        signalRConnection.on('DriverLocationUpdated', handleLocationUpdated);
        signalRConnection.on('DriverLocationRemoved', handleLocationRemoved);

        // Subscribe to ride status events
        signalRConnection.on('CallUpdated', handleCallUpdated);
        signalRConnection.on('CallAssigned', handleCallAssigned);
        signalRConnection.on('RideCompleted', handleRideCompleted);
        signalRConnection.on('CallDroppedOff', handleRideCompleted);

        return () => {
            // Unsubscribe when component unmounts or connection changes
            signalRConnection.off('DriverLocationUpdated', handleLocationUpdated);
            signalRConnection.off('DriverLocationRemoved', handleLocationRemoved);
            signalRConnection.off('CallUpdated', handleCallUpdated);
            signalRConnection.off('CallAssigned', handleCallAssigned);
            signalRConnection.off('RideCompleted', handleRideCompleted);
            signalRConnection.off('CallDroppedOff', handleRideCompleted);
        };
    }, [signalRConnection]);

    // Called when the map loads - don't auto-center after initial load
    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    // Called when the map unmounts
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Handle marker click - open side panel
    const handleMarkerClick = (driver, isAvailable = false) => {
        const driverId = driver.driver?.id || driver.driverId || driver.id;
        selectedDriverIdRef.current = driverId;
        setSidePanelDriver({ ...driver, isAvailable });
        setSidePanelOpen(true);
    };

    // Handle marker hover
    const handleMarkerMouseOver = (driver, isAvailable = false) => {
        setHoveredDriver({ ...driver, isAvailable });
    };

    const handleMarkerMouseOut = () => {
        setHoveredDriver(null);
    };

    // Close side panel
    const handleCloseSidePanel = () => {
        selectedDriverIdRef.current = null;
        setSidePanelOpen(false);
        setSidePanelDriver(null);
    };

    // Helper to get route stops with dynamic labels and colors (supports up to 10 stops)
    const getRouteStops = (route, isRoundTrip) => {
        if (!route) return [];
        const stops = [];
        // Extended color palette for up to 12 waypoints (pickup + 10 stops + dropoff)
        const colors = [
            '#4caf50', // A - Pickup (green)
            '#8bc34a', // B - Stop 1 (light green)
            '#cddc39', // C - Stop 2 (lime)
            '#ffeb3b', // D - Stop 3 (yellow)
            '#ffc107', // E - Stop 4 (amber)
            '#ff9800', // F - Stop 5 (orange)
            '#ff5722', // G - Stop 6 (deep orange)
            '#e91e63', // H - Stop 7 (pink)
            '#9c27b0', // I - Stop 8 (purple)
            '#673ab7', // J - Stop 9 (deep purple)
            '#3f51b5', // K - Stop 10 (indigo)
            '#f44336'  // Last - Dropoff/Return (red)
        ];
        let labelIndex = 0;

        // Pickup is always A (green)
        stops.push({ label: 'A', address: route.pickup, type: 'Pickup', color: colors[0] });
        labelIndex++;

        // Add stops B, C, D... up to stop 10
        const stopFields = ['stop1', 'stop2', 'stop3', 'stop4', 'stop5', 'stop6', 'stop7', 'stop8', 'stop9', 'stop10'];
        stopFields.forEach((field, idx) => {
            if (route[field]) {
                stops.push({
                    label: String.fromCharCode(65 + labelIndex),
                    address: route[field],
                    type: `Stop ${idx + 1}`,
                    color: colors[Math.min(labelIndex, colors.length - 2)]
                });
                labelIndex++;
            }
        });

        // Dropoff
        stops.push({
            label: String.fromCharCode(65 + labelIndex),
            address: route.dropOff,
            type: 'Drop-off',
            color: isRoundTrip ? colors[Math.min(labelIndex, colors.length - 2)] : '#f44336'
        });
        labelIndex++;

        // Round trip - pickup is last stop and should be red
        if (isRoundTrip) {
            stops.push({
                label: String.fromCharCode(65 + labelIndex),
                address: route.pickup,
                type: 'Return (Round Trip)',
                color: '#f44336',
                isRoundTrip: true
            });
        }

        return stops;
    };

    // Get stop count for a ride (supports up to 10 stops)
    const getStopCount = (route) => {
        return [
            route?.stop1, route?.stop2, route?.stop3, route?.stop4, route?.stop5,
            route?.stop6, route?.stop7, route?.stop8, route?.stop9, route?.stop10
        ].filter(stop => stop && stop.trim() !== '').length;
    };

    // Filter upcoming rides to exclude current ride
    const getFilteredUpcomingRides = (upcomingRides, currentRideId) => {
        if (!upcomingRides) return [];
        return upcomingRides.filter(ride => ride.rideId !== currentRideId);
    };

    // Get driver position from location updates
    const getDriverPosition = (driverData) => {
        // DriverRideShare has driver object nested, or it could be passed directly
        const driverId = driverData.driver?.id || driverData.driverId || driverData.id;
        const location = driverLocations[driverId];
        if (location && location.latitude && location.longitude) {
            return { lat: location.latitude, lng: location.longitude };
        }
        return null;
    };

    // Helper to get driver ID from DriverRideShare or direct driver object
    const getDriverId = (driverData) => {
        return driverData.driver?.id || driverData.driverId || driverData.id;
    };

    // Format time
    const formatTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Format date and time
    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    // Format duration
    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const parts = duration.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        }
        return duration;
    };

    // Show error if Google Maps failed to load
    if (loadError) {
        return (
            <Box p={3}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error" variant="h6" gutterBottom>
                        Failed to load Google Maps
                    </Typography>
                    <Typography color="text.secondary">
                        Please check your API key in src/config/googleMapsConfig.js
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Show loading state only on initial load
    if (!isLoaded || initialLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="500px"
            >
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    Loading map...
                </Typography>
            </Box>
        );
    }

    // Count drivers with known locations
    const drivingWithLocations = drivingDrivers.filter(d => getDriverPosition(d) !== null);

    // Filter out online drivers that are already in the driving list to prevent duplicate keys
    const drivingDriverIds = new Set(drivingDrivers.map(d => getDriverId(d)));
    const uniqueOnlineDrivers = onlineDrivers.filter(d => !drivingDriverIds.has(getDriverId(d)));
    const onlineWithLocations = uniqueOnlineDrivers.filter(d => getDriverPosition(d) !== null);

    const totalOnMap = drivingWithLocations.length + onlineWithLocations.length;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Driver Tracking
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Chip
                            icon={<CarIcon />}
                            label={`${drivingDrivers.length} Driving`}
                            size="small"
                            color="primary"
                        />
                        <Chip
                            icon={<CircleIcon sx={{ fontSize: 12 }} />}
                            label={`${uniqueOnlineDrivers.length} Available`}
                            size="small"
                            color="success"
                        />
                        {totalOnMap < (drivingDrivers.length + uniqueOnlineDrivers.length) && (
                            <Chip
                                label={`${totalOnMap} with GPS`}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>

                {/* Legend - always visible at top */}
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%' }} />
                        <Typography variant="body2" color="text.secondary">Driving (Online)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 12, height: 12, bgcolor: '#9e9e9e', borderRadius: '50%' }} />
                        <Typography variant="body2" color="text.secondary">Driving (Offline)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                        <Typography variant="body2" color="text.secondary">Available</Typography>
                    </Box>
                </Box>

                {/* Badges */}
                <Box display="flex" gap={1}>
                    <Badge badgeContent={drivingDrivers.length} color="primary">
                        <CarIcon fontSize="large" />
                    </Badge>
                    <Badge badgeContent={uniqueOnlineDrivers.length} color="success">
                        <PersonIcon fontSize="large" />
                    </Badge>
                </Box>
            </Box>

            {/* Map Container */}
            <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2 }}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={initialCenter.current}
                    zoom={DEFAULT_MAP_ZOOM}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={mapOptions}
                >
                    {/* Driving Driver Markers (blue/gray) */}
                    {drivingDrivers.map(driverData => {
                        const position = getDriverPosition(driverData);
                        if (!position) return null;
                        const isOnline = driverData.isOnline;

                        return (
                            <Marker
                                key={`driving-${getDriverId(driverData)}`}
                                position={position}
                                icon={getDrivingDriverIcon(isOnline)}
                                onClick={() => handleMarkerClick(driverData, false)}
                                onMouseOver={() => handleMarkerMouseOver(driverData, false)}
                                onMouseOut={handleMarkerMouseOut}
                            />
                        );
                    })}

                    {/* Available Driver Markers (green) */}
                    {uniqueOnlineDrivers.map(driverData => {
                        const position = getDriverPosition(driverData);
                        if (!position) return null;

                        return (
                            <Marker
                                key={`available-${getDriverId(driverData)}`}
                                position={position}
                                icon={getAvailableDriverIcon()}
                                onClick={() => handleMarkerClick(driverData, true)}
                                onMouseOver={() => handleMarkerMouseOver(driverData, true)}
                                onMouseOut={handleMarkerMouseOut}
                            />
                        );
                    })}

                    {/* Hover InfoWindow - no close button */}
                    {hoveredDriver && getDriverPosition(hoveredDriver) && (
                        <InfoWindow
                            position={getDriverPosition(hoveredDriver)}
                            options={{
                                pixelOffset: new window.google.maps.Size(0, -35),
                                disableAutoPan: true,
                                maxWidth: 250
                            }}
                        >
                            <Box sx={{ minWidth: 150, p: 0 }}>
                                <style>{`.gm-ui-hover-effect { display: none !important; }`}</style>
                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {hoveredDriver.driver?.name}
                                    </Typography>
                                    {hoveredDriver.isOnline !== undefined && (
                                        hoveredDriver.isOnline ?
                                            <OnlineIcon sx={{ fontSize: 14, color: 'success.main' }} /> :
                                            <OfflineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                    )}
                                </Box>
                                <Chip
                                    label={hoveredDriver.isAvailable ? 'Available' : 'On Call'}
                                    size="small"
                                    color={hoveredDriver.isAvailable ? 'success' : 'primary'}
                                    sx={{ mb: 0.5 }}
                                />
                                {hoveredDriver.primaryCar && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {hoveredDriver.primaryCar.color} {hoveredDriver.primaryCar.make} {hoveredDriver.primaryCar.model}
                                    </Typography>
                                )}
                                {hoveredDriver.currentRide && (
                                    <Typography variant="caption" color="primary" display="block">
                                        Heading to {hoveredDriver.currentRide.route?.dropOff || 'Unknown destination'}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Click for details
                                </Typography>
                            </Box>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </Paper>

            {/* Driver Detail Side Panel - Only shown when a driver is clicked */}
            <Drawer
                anchor="right"
                open={sidePanelOpen}
                onClose={handleCloseSidePanel}
            >
                <Box sx={{ width: 400, p: 2 }}>
                    {/* Panel Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon color="primary" />
                            <Typography variant="h6">Driver Details</Typography>
                            {sidePanelDriver?.isAvailable ? (
                                <Chip label="Available" size="small" color="success" />
                            ) : (
                                <Chip label="On Call" size="small" color="primary" />
                            )}
                        </Box>
                        <IconButton onClick={handleCloseSidePanel}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {sidePanelDriver && (
                        <Box>
                            {/* Online Status */}
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                {sidePanelDriver.isOnline ? (
                                    <>
                                        <OnlineIcon color="success" />
                                        <Typography variant="body2" color="success.main">Online</Typography>
                                    </>
                                ) : (
                                    <>
                                        <OfflineIcon color="disabled" />
                                        <Typography variant="body2" color="text.disabled">Offline</Typography>
                                    </>
                                )}
                            </Box>

                            {/* Driver Info Section */}
                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                        Driver Information
                                    </Typography>
                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText
                                                primary="Name"
                                                secondary={sidePanelDriver.driver?.name || 'N/A'}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText
                                                primary="Phone"
                                                secondary={sidePanelDriver.driver?.phoneNumber || 'N/A'}
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>

                            {/* Car Info Section */}
                            {sidePanelDriver.primaryCar && (
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            <CarIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                            Vehicle Information
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemText
                                                    primary="Vehicle"
                                                    secondary={`${sidePanelDriver.primaryCar.year || ''} ${sidePanelDriver.primaryCar.make || ''} ${sidePanelDriver.primaryCar.model || ''}`}
                                                />
                                                <ListItemText
                                                    primary="License Plate"
                                                    secondary={sidePanelDriver.primaryCar.licensePlate || 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText
                                                    primary="Color"
                                                    secondary={sidePanelDriver.primaryCar.color || 'N/A'}
                                                />
                                                <ListItemText
                                                    primary="Seats"
                                                    secondary={sidePanelDriver.primaryCar.seats || 'N/A'}
                                                />
                                                <ListItemText
                                                    primary="Type"
                                                    secondary={sidePanelDriver.primaryCar.type || 'N/A'}
                                                />
                                            </ListItem>
                                        </List>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Current Ride Section - Only for driving drivers */}
                            {!sidePanelDriver.isAvailable && sidePanelDriver.currentRide && (
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            <RouteIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                            Current Ride
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Customer"
                                                    secondary={sidePanelDriver.currentRide.customerName || 'N/A'}
                                                />
                                                <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Customer Phone"
                                                    secondary={sidePanelDriver.currentRide.customerPhoneNumber || 'N/A'}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon><ScheduledIcon fontSize="small" color="primary" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Scheduled For"
                                                    secondary={formatTime(sidePanelDriver.currentRide.scheduledFor)}
                                                />
                                                <ListItemIcon><DurationIcon fontSize="small" color="info" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Est. Duration"
                                                    secondary={formatDuration(sidePanelDriver.currentRide.route?.estimatedDuration)}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon><PickupTimeIcon fontSize="small" color="success" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Pickup Time"
                                                    secondary={formatTime(sidePanelDriver.currentRide.pickupTime)}
                                                />
                                                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText
                                                    primary="Passengers"
                                                    secondary={sidePanelDriver.currentRide.passengers || 'N/A'}
                                                />
                                            </ListItem>
                                            {isAdmin && (
                                                <ListItem>
                                                    <ListItemIcon><MoneyIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText
                                                        primary="Cost"
                                                        secondary={formatCurrency(sidePanelDriver.currentRide.cost)}
                                                    />
                                                    <ListItemText
                                                        primary="Payment Type"
                                                        secondary={sidePanelDriver.currentRide.paymentType || 'N/A'}
                                                    />
                                                </ListItem>
                                            )}
                                            {sidePanelDriver.currentRide.notes && (
                                                <ListItem>
                                                    <ListItemIcon><NotesIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText
                                                        primary="Notes"
                                                        secondary={sidePanelDriver.currentRide.notes}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Route Section - Only for driving drivers - Dynamic labels and colors */}
                            {!sidePanelDriver.isAvailable && sidePanelDriver.currentRide?.route && (
                                <Card variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            <LocationIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                                            Route
                                            {sidePanelDriver.currentRide.route.roundTrip && (
                                                <Chip label="↺ Round Trip" size="small" color="info" sx={{ ml: 1 }} />
                                            )}
                                        </Typography>
                                        <List dense>
                                            {getRouteStops(sidePanelDriver.currentRide.route, sidePanelDriver.currentRide.route.roundTrip).map((stop, index) => (
                                                <ListItem key={index}>
                                                    <ListItemIcon>
                                                        <Chip
                                                            label={stop.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: stop.color,
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={stop.type}
                                                        secondary={stop.address || 'N/A'}
                                                        secondaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Upcoming Rides Section - Collapsible, shows rides for THIS driver */}
                            <Card variant="outlined" sx={{ mb: 2 }}>
                                <ListItemButton onClick={() => setUpcomingCallsExpanded(!upcomingCallsExpanded)}>
                                    <ListItemIcon>
                                        <EventNoteIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Upcoming Calls
                                                </Typography>
                                                <Chip
                                                    label={
                                                        !sidePanelDriver.isAvailable && sidePanelDriver.currentRide
                                                            ? (sidePanelDriver.upcomingRides?.filter(r => r.rideId !== sidePanelDriver.currentRide.rideId)?.length || 0)
                                                            : (sidePanelDriver.upcomingRides?.length || 0)
                                                    }
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                    />
                                    {upcomingCallsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </ListItemButton>
                                <Collapse in={upcomingCallsExpanded} timeout="auto" unmountOnExit>
                                    <Divider />
                                    <CardContent sx={{ pt: 1 }}>
                                        {(() => {
                                            // Filter out current ride for driving drivers
                                            const filteredRides = !sidePanelDriver.isAvailable && sidePanelDriver.currentRide
                                                ? sidePanelDriver.upcomingRides?.filter(r => r.rideId !== sidePanelDriver.currentRide.rideId)
                                                : sidePanelDriver.upcomingRides;

                                            if (!filteredRides || filteredRides.length === 0) {
                                                return (
                                                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                                        No upcoming rides scheduled for this driver
                                                    </Typography>
                                                );
                                            }

                                            return (
                                                <List dense>
                                                    {filteredRides.map((ride, index) => {
                                                        const stops = getStopCount(ride.route);
                                                        return (

                                                            <ListItem
                                                                key={ride.rideId || index}
                                                                divider={index < filteredRides.length - 1}
                                                                sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                                                            >
                                                                {/* Header row with customer name and time */}
                                                                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mb={0.5}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <ScheduleIcon fontSize="small" color="action" />
                                                                        <Typography variant="body2" fontWeight="medium">
                                                                            {ride.customerName || 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Chip
                                                                        label={formatDateTime(ride.scheduledFor)}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                </Box>
                                                                {/* Pickup line */}
                                                                <Box display="flex" alignItems="flex-start" gap={0.5} pl={1}>
                                                                    <PlaceIcon sx={{ fontSize: 14, color: 'success.main', mt: 0.3 }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                                                        {ride.route?.pickup || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                                {/* Dropoff line */}
                                                                <Box display="flex" alignItems="flex-start" gap={0.5} pl={1}>
                                                                    <DropoffIcon sx={{ fontSize: 14, color: 'error.main', mt: 0.3 }} />
                                                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                                                        {ride.route?.dropOff || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                                {!!stops && <Chip
                                                                    label={`${stops} stop${stops != 1 ? 's' : ''}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="info"
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />}
                                                            </ListItem>
                                                        )
                                                    })}
                                                </List>
                                            );
                                        })()}
                                    </CardContent>
                                </Collapse>
                            </Card>

                            {/* Location Update Info */}
                            {driverLocations[getDriverId(sidePanelDriver)] && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Last location update: {
                                            new Date(driverLocations[getDriverId(sidePanelDriver)].lastUpdate)
                                                .toLocaleTimeString()
                                        }
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Drawer>
        </Box>
    );
};

export default DriverTracking;
