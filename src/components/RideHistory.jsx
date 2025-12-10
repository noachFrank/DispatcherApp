import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    CardActions,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Autocomplete,
    Popover
} from '@mui/material';
import { formatDateTime, formatDate } from '../utils/dateHelpers';
import {
    Search as SearchIcon,
    History as HistoryIcon,
    Message as MessageIcon,
    Cancel as CancelIcon,
    SwapHoriz as ReassignIcon,
    FilterList as FilterListIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { ridesAPI, driversAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { getRideStatus, getRideStatusColor } from '../utils/Status';
import DriverMessagingModal from './DriverMessagingModal';

const RideHistory = ({ onItemClick, initialSearchQuery = '', onSearchQueryUsed }) => {
    const { signalRConnection } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchInputRef = useRef(null);

    // Get initial search from URL or prop
    const getInitialSearch = () => {
        const params = new URLSearchParams(location.search);
        return params.get('search') || initialSearchQuery || '';
    };

    const [rides, setRides] = useState([]);
    const [filteredRides, setFilteredRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(getInitialSearch);
    const [isFullHistory, setIsFullHistory] = useState(false);
    const [loadingFullHistory, setLoadingFullHistory] = useState(false);
    const [pendingSearchQuery, setPendingSearchQuery] = useState(getInitialSearch()); // Track initial search to check after load

    // Messaging state
    const [showMessaging, setShowMessaging] = useState(false);
    const [messagingDriverId, setMessagingDriverId] = useState(null);
    const [messagingDriverName, setMessagingDriverName] = useState('');
    const [messagingRideContext, setMessagingRideContext] = useState(null);

    // Filter state and logic
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterValues, setFilterValues] = useState({
        dateFrom: '',
        dateTo: '',
        driver: null,
        customerName: '',
        customerNumber: ''
    });
    const [filterApplied, setFilterApplied] = useState(false);
    const [driverOptions, setDriverOptions] = useState([]);
    const [allDriversLoaded, setAllDriversLoaded] = useState(false);

    // Focus search input on mount
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Sync search query FROM URL when location changes (e.g., navigating back from detail view)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search') || '';
        if (urlSearch !== searchQuery) {
            setSearchQuery(urlSearch);
            if (urlSearch) {
                setPendingSearchQuery(urlSearch);
            }
        }
    }, [location.search]);

    // Sync search query with URL
    const updateUrlWithSearch = useCallback((query) => {
        const params = new URLSearchParams(location.search);
        if (query) {
            params.set('search', query);
        } else {
            params.delete('search');
        }
        navigate(`/dashboard/history?${params.toString()}`, { replace: true });
    }, [navigate, location.search]);

    // Apply initial search query when it changes from prop
    useEffect(() => {
        if (initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
            setPendingSearchQuery(initialSearchQuery);
            updateUrlWithSearch(initialSearchQuery);
            // Notify parent that we've used the search query
            if (onSearchQueryUsed) {
                onSearchQueryUsed();
            }
        }
    }, [initialSearchQuery, onSearchQueryUsed, updateUrlWithSearch]);

    // Get the start of this week (Sunday)
    const getWeekStart = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    };



    const weekStartFormatted = formatDate(getWeekStart());

    useEffect(() => {
        loadThisWeekRides();
    }, []);

    // After rides load, check if we have a pending search query that wasn't found - if so, load full history
    useEffect(() => {
        if (pendingSearchQuery && !loading && rides.length >= 0 && !isFullHistory) {
            const query = pendingSearchQuery.toLowerCase().trim();
            const found = rides.some(ride => ride.rideId?.toString().toLowerCase() === query);
            if (!found) {
                // Ride not found in this week, load full history
                setPendingSearchQuery(null); // Clear so we don't loop
                loadFullHistory();
            } else {
                setPendingSearchQuery(null); // Found it, clear pending
            }
        }
    }, [rides, loading, pendingSearchQuery, isFullHistory]);

    useEffect(() => {
        // Filter rides based on search query (ID only)
        if (searchQuery.trim() === '') {
            setFilteredRides(rides);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = rides.filter(ride =>
                ride.rideId?.toString().toLowerCase() === query
            );
            setFilteredRides(filtered);
        }
    }, [searchQuery, rides]);

    // Fetch driver options for filter dropdown (example: from rides)
    useEffect(() => {
        if (!allDriversLoaded) {
            driversAPI.getAll().then(drivers => {
                setDriverOptions(drivers.map(d => ({ label: d.name, id: d.id })));
                setAllDriversLoaded(true);
            });
        }
    }, [allDriversLoaded]);

    // Filter rides based on filterValues
    const getFilteredRidesByFilter = useCallback(() => {
        return rides.filter(ride => {
            let pass = true;
            if (filterValues.dateFrom) {
                pass = pass && new Date(ride.scheduledFor) >= new Date(filterValues.dateFrom);
            }
            if (filterValues.dateTo) {
                pass = pass && new Date(ride.scheduledFor) <= new Date(filterValues.dateTo);
            }
            if (filterValues.driver) {
                pass = pass &&
                    ((ride.reassigned && ride.reassignedTo?.name === filterValues.driver.label)
                        || (!ride.reassigned && ride.assignedTo?.name === filterValues.driver.label));
            }
            if (filterValues.customerName) {
                pass = pass && ride.customerName?.toLowerCase().includes(filterValues.customerName.toLowerCase());
            }
            if (filterValues.customerNumber) {
                pass = pass && ride.customerPhoneNumber?.toLowerCase().includes(filterValues.customerNumber.toLowerCase());
            }
            return pass;
        });
    }, [rides, filterValues]);

    useEffect(() => {
        const applyFilter = async () => {
            if (filterApplied) {
                if (!isFullHistory) {
                    // Load full history, then apply filter
                    await loadFullHistory();
                }
                setFilteredRides(getFilteredRidesByFilter());
            } else {
                setFilteredRides(rides);
            }
        }
        applyFilter();
        // Only re-run when filterApplied, rides, or filter logic changes
    }, [filterApplied, rides, getFilteredRidesByFilter, isFullHistory]);

    const loadThisWeekRides = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ridesAPI.getThisWeek();
            // Sort by newest first (using createdAt or pickupTime)
            const sorted = (data || []).sort((a, b) => {
                const dateA = new Date(a.scheduledFor || 0);
                const dateB = new Date(b.scheduledFor || 0);
                return dateB - dateA;
            });
            setRides(sorted);
            setFilteredRides(sorted);
            setIsFullHistory(false);
        } catch (err) {
            console.error('Error loading this week rides:', err);
            setError('Failed to load ride history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadFullHistory = async () => {
        try {
            setLoadingFullHistory(true);
            setError(null);
            const data = await ridesAPI.getAllHistory();
            // Sort by newest first
            const sorted = (data || []).sort((a, b) => {
                const dateA = new Date(a.scheduledFor || 0);
                const dateB = new Date(b.scheduledFor || 0);
                return dateB - dateA;
            });
            setRides(sorted);
            setFilteredRides(sorted);
            setIsFullHistory(true);
        } catch (err) {
            console.error('Error loading full history:', err);
            setError('Failed to load full history. Please try again.');
        } finally {
            setLoadingFullHistory(false);
        }
    };

    // Check if ride is completed (has dropOffTime)
    const isRideCompleted = (ride) => {
        return ride.dropOffTime != null;
    };

    const handleCancelCall = async (rideId) => {
        if (window.confirm('Are you sure you want to cancel this call?')) {
            try {
                await ridesAPI.cancel(rideId);
                alert('Call cancelled successfully');
                // Refresh the data
                if (isFullHistory) {
                    loadFullHistory();
                } else {
                    loadThisWeekRides();
                }
            } catch (error) {
                console.error('Failed to cancel call:', error);
                alert('Failed to cancel call. Please try again.');
            }
        }
    };

    const handleReassignCall = async (rideId) => {
        if (window.confirm('Are you sure you want to reassign this call? The driver will be removed and the call will become available again.')) {
            try {
                if (signalRConnection) {
                    console.log('Reassigning call via SignalR:', rideId);
                    await signalRConnection.invoke("CallDriverCancelled", rideId);
                } else {
                    console.warn('SignalR not connected, cannot reassign call');
                    alert('SignalR not connected. Please refresh the page and try again.');
                    return;
                }

                alert('Call reassigned successfully');
                if (isFullHistory) {
                    loadFullHistory();
                } else {
                    loadThisWeekRides();
                }
            } catch (error) {
                console.error('Failed to reassign call:', error);
                alert('Failed to reassign call. Please try again.');
            }
        }
    };

    const handleMessageDriver = (ride) => {
        let targetDriverId = ride.reassigned ? ride.reassignedToId : ride.assignedToId;
        let targetDriverName = ride.reassigned
            ? (ride.reassignedTo?.name || `Driver #${ride.reassignedToId}`)
            : (ride.assignedTo?.name || `Driver #${ride.assignedToId}`);

        let rideContext = {
            rideId: ride.rideId,
            customerName: ride.customerName,
            customerPhone: ride.customerPhoneNumber
        };

        setMessagingDriverId(targetDriverId);
        setMessagingDriverName(targetDriverName || `Driver #${targetDriverId}`);
        setMessagingRideContext(rideContext);
        setShowMessaging(true);
    };

    const handleMessagingClose = () => {
        setShowMessaging(false);
        setMessagingDriverId(null);
        setMessagingDriverName('');
        setMessagingRideContext(null);
    };

    // Handle search query change - update state and URL
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        updateUrlWithSearch(query);
    };

    const handleViewDetails = (rideId) => {
        if (onItemClick) {
            onItemClick('ride', rideId, { from: 'history', searchQuery });
        }
    };

    const renderRideItem = (ride) => {
        const status = getRideStatus(ride);
        const completed = isRideCompleted(ride);

        return (
            <Card
                key={ride.rideId}
                sx={{
                    mb: 2,
                    backgroundColor: ride.canceled ? '#ffebee' : completed ? '#e8f5e9' : 'inherit',
                    position: 'relative',
                    overflow: 'visible'
                }}
            >
                {/* Canceled Overlay */}
                {ride.canceled && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-15deg)',
                            zIndex: 10,
                            pointerEvents: 'none'
                        }}
                    >
                        <Typography
                            variant="h3"
                            sx={{
                                color: '#d32f2f',
                                fontWeight: 'bold',
                                opacity: 0.8,
                                textTransform: 'uppercase',
                                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                                letterSpacing: '0.2em',
                                fontStyle: 'italic'
                            }}
                        >
                            Canceled
                        </Typography>
                    </Box>
                )}

                {/* Completed Overlay */}
                {completed && !ride.canceled && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-15deg)',
                            zIndex: 10,
                            pointerEvents: 'none'
                        }}
                    >
                        <Typography
                            variant="h3"
                            sx={{
                                color: '#2e7d32',
                                fontWeight: 'bold',
                                opacity: 0.8,
                                textTransform: 'uppercase',
                                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                                letterSpacing: '0.2em',
                                fontStyle: 'italic'
                            }}
                        >
                            Completed
                        </Typography>
                    </Box>
                )}

                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="primary">
                            RideId {ride.rideId}
                        </Typography>
                        <Chip
                            label={status}
                            color={getRideStatusColor(status)}
                            size="small"
                        />
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            {ride.customerName && <Typography variant="body2" color="text.secondary">
                                <strong>Customer:</strong> {ride.customerName}
                            </Typography>}
                            {ride.customerPhoneNumber && <Typography variant="body2" color="text.secondary">
                                <strong>Phone #:</strong> {ride.customerPhoneNumber}
                            </Typography>}
                            <Typography variant="body2" color="text.secondary">
                                👥 <strong>Passengers:</strong> {ride.passengers || 1}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                🚗 <strong>Car Type:</strong> {['Car', 'SUV', 'MiniVan', '12 Passenger', '15 Passenger', 'Luxury SUV'][ride.carType] || 'Car'}
                            </Typography>
                        </Grid>

                        {/* Route with emoji icons */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    📍 <strong>Pickup:</strong> {ride.route?.pickup || 'N/A'}
                                </Typography>
                                {/* Show stops if any */}
                                {ride.route?.stop1 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 1:</strong> {ride.route.stop1}
                                    </Typography>
                                )}
                                {ride.route?.stop2 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 2:</strong> {ride.route.stop2}
                                    </Typography>
                                )}
                                {ride.route?.stop3 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 3:</strong> {ride.route.stop3}
                                    </Typography>
                                )}
                                {ride.route?.stop4 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 4:</strong> {ride.route.stop4}
                                    </Typography>
                                )}
                                {ride.route?.stop5 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 5:</strong> {ride.route.stop5}
                                    </Typography>
                                )}
                                {ride.route?.stop6 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 6:</strong> {ride.route.stop6}
                                    </Typography>
                                )}
                                {ride.route?.stop7 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 7:</strong> {ride.route.stop7}
                                    </Typography>
                                )}
                                {ride.route?.stop8 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 8:</strong> {ride.route.stop8}
                                    </Typography>
                                )}
                                {ride.route?.stop9 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 9:</strong> {ride.route.stop9}
                                    </Typography>
                                )}
                                {ride.route?.stop10 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                                        📌 <strong>Stop 10:</strong> {ride.route.stop10}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    🏁 <strong>Dropoff:</strong> {ride.route?.dropOff || 'N/A'}
                                </Typography>
                                {ride.route?.roundTrip && (
                                    <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                                        🔄 Round Trip
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Cost and Driver's Compensation */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    💵 <strong>Cost:</strong> ${ride.cost || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    💰 <strong>Driver Comp:</strong> ${ride.driversCompensation || 0}
                                </Typography>
                            </Box>
                        </Grid>

                        {ride.assignedToId && (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Driver:</strong> #{ride.reassigned ? ride.reassignedToId : ride.assignedToId} - {ride.reassigned ? ride.reassignedTo?.name : ride.assignedTo?.name}
                                </Typography>
                                {(ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber) && (
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Driver Phone:</strong> {ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber}
                                    </Typography>
                                )}
                            </Grid>
                        )}

                        {/* Times section */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {ride.scheduledFor && (
                                    <Typography variant="body2" color="text.secondary">
                                        🗓️ <strong>Scheduled:</strong> {formatDateTime(ride.scheduledFor)}
                                    </Typography>
                                )}
                                {ride.callTime && (
                                    <Typography variant="body2" color="text.secondary">
                                        📞 <strong>Call Time:</strong> {formatDateTime(ride.callTime)}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Pickup and Dropoff Times (if completed) */}
                        {(ride.pickupTime || ride.dropOffTime) && (
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {ride.pickupTime && (
                                        <Typography variant="body2" color="success.main">
                                            ✅ <strong>Picked Up:</strong> {formatDateTime(ride.pickupTime)}
                                        </Typography>
                                    )}
                                    {ride.dropOffTime && (
                                        <Typography variant="body2" color="success.main">
                                            ✅ <strong>Dropped Off:</strong> {formatDateTime(ride.dropOffTime)}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        )}

                        {/* Canceled indicator */}
                        {ride.canceled && (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="error.main">
                                    ❌ <strong>Canceled</strong>
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>

                <CardActions sx={{ flexWrap: 'wrap', gap: 1, p: 2, pt: 0 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewDetails(ride.rideId)}
                    >
                        View Details
                    </Button>

                    {/* Show Message button for all non-canceled rides that aren't completed */}
                    {(!ride.canceled && !ride.dropOffTime && ((ride.reassigned && ride.reassignedToId) || (!ride.reassigned && ride.assignedToId))) && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<MessageIcon />}
                            onClick={() => handleMessageDriver(ride)}
                        >
                            Message Driver
                        </Button>
                    )}

                    {(!ride.canceled && !ride.pickupTime) && (
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelCall(ride.rideId)}
                        >
                            Cancel
                        </Button>
                    )}

                    {(!ride.canceled && ((!ride.reassigned && ride.assignedToId) ||
                        (ride.reassigned && ride.reassignedToId)) && !ride.pickupTime) && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ReassignIcon />}
                                onClick={() => handleReassignCall(ride.rideId)}
                            >
                                Reassign
                            </Button>
                        )}
                </CardActions>
            </Card>
        );
    };

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {isFullHistory
                        ? 'Full Ride History'
                        : `Ride History for Week of ${weekStartFormatted}`
                    }
                </Typography>

                {/* Search Bar */}
                <Box display="flex" alignItems="center" mb={2}>
                    <TextField
                        inputRef={searchInputRef}
                        label="Search"
                        placeholder="Search by Ride ID"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        sx={{ flex: 1, mr: 2 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={e => {
                            setFilterAnchorEl(e.currentTarget);
                            setFilterOpen(true);
                        }}
                        sx={{ mr: 2 }}
                    >
                        Filter
                    </Button>
                    {filterApplied && (
                        <Button
                            variant="text"
                            color="error"
                            onClick={() => {
                                setFilterApplied(false);
                                setFilterValues({ dateFrom: '', dateTo: '', driver: null, customerName: '', customerNumber: '' });
                            }}
                        >
                            Remove Filter
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Ride List */}
                    <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                        {filteredRides.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                <Typography color="text.secondary">
                                    {searchQuery ? 'No rides found matching your search' : 'No rides found'}
                                </Typography>
                            </Box>
                        ) : (
                            filteredRides.map((ride) => renderRideItem(ride))
                        )}
                    </Box>

                    {/* Load Full History Button */}
                    {!isFullHistory && (
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={loadFullHistory}
                                disabled={loadingFullHistory}
                                startIcon={loadingFullHistory ? <CircularProgress size={20} /> : <HistoryIcon />}
                            >
                                {loadingFullHistory ? 'Loading...' : 'Load Full History'}
                            </Button>
                        </Box>
                    )}

                    {/* Back to This Week Button (when viewing full history) */}
                    {isFullHistory && (
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={loadThisWeekRides}
                                disabled={loading}
                            >
                                Back to This Week
                            </Button>
                        </Box>
                    )}
                </>
            )}

            {/* Driver Messaging Modal */}
            <DriverMessagingModal
                isOpen={showMessaging}
                onClose={handleMessagingClose}
                driverId={messagingDriverId}
                driverName={messagingDriverName}
                rideContext={messagingRideContext}
                onNavigateToRideHistory={(rideId) => {
                    // Close the modal and search for the ride
                    handleMessagingClose();
                    setSearchQuery(rideId.toString());
                    setPendingSearchQuery(rideId.toString());
                }}
            />

            {/* Filter Popover */}
            <Popover
                open={filterOpen}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ sx: { p: 2, minWidth: 300 } }}
            >
                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="Date From"
                        type="date"
                        value={filterValues.dateFrom}
                        onChange={e => setFilterValues(v => ({ ...v, dateFrom: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Date To"
                        type="date"
                        value={filterValues.dateTo}
                        onChange={e => setFilterValues(v => ({ ...v, dateTo: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Autocomplete
                        options={driverOptions}
                        value={filterValues.driver}
                        onChange={(_, value) => setFilterValues(v => ({ ...v, driver: value }))}
                        renderInput={params => <TextField {...params} label="Driver" />}
                    />
                    <TextField
                        label="Customer Name"
                        value={filterValues.customerName}
                        onChange={e => setFilterValues(v => ({ ...v, customerName: e.target.value }))}
                    />
                    <TextField
                        label="Customer Number"
                        value={filterValues.customerNumber}
                        onChange={e => setFilterValues(v => ({ ...v, customerNumber: e.target.value }))}
                    />
                    <Button
                        variant="contained"
                        onClick={() => {
                            setFilterApplied(true);
                            setFilterOpen(false);
                        }}
                    >
                        Apply Filter
                    </Button>
                </Box>
            </Popover>
        </Box>
    );
};

export default RideHistory;
