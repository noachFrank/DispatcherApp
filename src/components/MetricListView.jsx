import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Badge
} from '@mui/material';
import { formatDateTime } from '../utils/dateHelpers';
import {
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  Cancel as CancelIcon,
  SwapHoriz as ReassignIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MarkEmailUnread as UnreadIcon
} from '@mui/icons-material';
import DriverMessagingModal from './DriverMessagingModal';
import { driversAPI, ridesAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { getRideStatus, getRideStatusColor, getDriverStatusColor } from '../utils/Status';

const MetricListView = ({
  metricType,
  data: initialData,
  onItemClick,
  onBackToDashboard,
  driversWithUnread = new Set(),
  onMarkMessagesRead,
  onNavigateToRideHistory
}) => {
  const { signalRConnection } = useAuth();
  const [data, setData] = useState(initialData || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingDriverId, setMessagingDriverId] = useState(null);
  const [messagingDriverName, setMessagingDriverName] = useState('');
  const [messagingRideContext, setMessagingRideContext] = useState(null); // { rideId, customerName, customerPhone }
  const [driverStatuses, setDriverStatuses] = useState({});
  const [loading, setLoading] = useState(false);

  // Load data based on metricType when component mounts or when initialData is empty
  useEffect(() => {
    const loadData = async () => {
      // If we have initialData, use it
      if (initialData && initialData.length > 0) {
        setData(initialData);
        return;
      }

      // Otherwise, fetch data based on metricType
      if (!metricType) return;

      setLoading(true);
      try {
        let fetchedData = [];
        switch (metricType) {
          case 'assignedRides':
            fetchedData = await ridesAPI.getAssigned();
            break;
          case 'ridesInProgress':
            fetchedData = await ridesAPI.getInProgress();
            break;
          case 'openRides':
            fetchedData = await ridesAPI.getOpen();
            break;
          case 'futureRides':
            fetchedData = await ridesAPI.getFuture();
            break;
          case 'todaysRides':
            fetchedData = await ridesAPI.getToday();
            break;
          case 'activeDrivers':
            fetchedData = await driversAPI.getActive();
            break;
          case 'driversCurrentlyDriving':
            fetchedData = await driversAPI.getDriving();
            break;
          default:
            console.warn('Unknown metric type:', metricType);
        }
        setData(fetchedData || []);
      } catch (error) {
        console.error('Failed to load data for metric:', metricType, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [metricType, initialData]);

  // Fetch driver statuses when component mounts or data changes
  useEffect(() => {
    const fetchDriverStatuses = async () => {
      if (Array.isArray(data) && data.length > 0 && (metricType?.includes('Drivers') || metricType?.includes('drivers'))) {
        const statusPromises = data.map(async (driver) => {
          try {
            const status = await driversAPI.getDriverStatus(driver.id);
            return { id: driver.id, status };
          } catch (error) {
            console.error(`Failed to fetch status for driver ${driver.id}:`, error);
            return { id: driver.id, status: 'unknown' };
          }
        });

        const results = await Promise.all(statusPromises);
        const statusMap = {};
        results.forEach(({ id, status }) => {
          statusMap[id] = status;
        });

        setDriverStatuses(statusMap);
      }
    };

    fetchDriverStatuses();
  }, [data, metricType]);

  const handleCancelCall = async (callId) => {
    if (window.confirm('Are you sure you want to cancel this call?')) {
      try {
        await ridesAPI.cancel(callId);
        alert('Call cancelled successfully');
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Failed to cancel call:', error);
        alert('Failed to cancel call. Please try again.');
      }
    }
  };

  const handleReassignCall = async (callId) => {
    if (window.confirm('Are you sure you want to reassign this call? The driver will be removed and the call will become available again.')) {
      try {
        // Use SignalR to notify about reassignment - this will:
        // 1. Update the database
        // 2. Notify the assigned driver that they've been removed
        // 3. Broadcast to all available drivers that the call is available
        // 4. Notify all dispatchers about the change
        if (signalRConnection) {
          console.log('Reassigning call via SignalR:', callId);
          await signalRConnection.invoke("CallDriverCancelled", callId);
        } else {
          console.warn('SignalR not connected, cannot reassign call');
          alert('SignalR not connected. Please refresh the page and try again.');
          return;
        }

        alert('Call reassigned successfully');
        window.location.reload();

      } catch (error) {
        console.error('Failed to reassign call:', error);
        alert('Failed to reassign call. Please try again.');
      }
    }
  };

  const handleMessageDriver = (driverId, driverName, ride = null) => {
    // If messaging from a ride, determine the correct driver ID
    // If ride.Reassigned is true, use ride.ReassignedToId, else use ride.AssignedToId
    let targetDriverId = driverId;
    let targetDriverName = driverName;
    let rideContext = null;

    if (ride) {
      targetDriverId = ride.reassigned ? ride.reassignedToId : ride.assignedToId;
      targetDriverName = ride.reassigned
        ? (ride.reassignedTo?.name || `Driver #${ride.reassignedToId}`)
        : (ride.assignedTo?.name || `Driver #${ride.assignedToId}`);

      // Set ride context for message prefix
      rideContext = {
        rideId: ride.rideId,
        customerName: ride.customerName,
        customerPhone: ride.customerPhoneNumber
      };
    }

    // Mark messages from this driver as read
    if (onMarkMessagesRead && targetDriverId) {
      onMarkMessagesRead(targetDriverId);
    }

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

  const getTitle = () => {
    switch (metricType) {
      case 'assignedRides':
        return 'Assigned Rides';
      case 'ridesInProgress':
        return 'Rides in Progress';
      case 'openRides':
        return 'Open Rides';
      case 'futureRides':
        return 'Future Rides';
      case 'todaysRides':
        return 'Today\'s Rides';
      case 'activeDrivers':
        return 'Active Drivers';
      case 'driversCurrentlyDriving':
        return 'Drivers Currently Driving';
      default:
        return 'List View';
    }
  };

  const isRideList = metricType?.includes('Rides') || metricType?.includes('rides');
  const isDriverList = metricType?.includes('Drivers') || metricType?.includes('drivers');

  // Filter data based on search query
  const getFilteredData = () => {
    if (!searchQuery.trim() || !Array.isArray(data)) {
      return data;
    }

    const query = searchQuery.toLowerCase().trim();

    if (isRideList) {
      return data.filter(ride => {
        const searchableFields = [
          ride.rideId?.toString(),
          ride.customerName,
          ride.customerPhoneNumber,
          ride.route?.pickup,
          ride.route?.dropOff,
          ride.assignedTo?.name.toString(),
          ride.notes,
          formatDateTime(ride.callTime),
          formatDateTime(ride.scheduledFor)
        ];
        return searchableFields.some(field =>
          field && field.toLowerCase().includes(query)
        );
      });
    }

    if (isDriverList) {
      return data.filter(driver => {
        const searchableFields = [
          driver.id?.toString(),
          driver.name,
          driver.phoneNumber,
          driver.email,
        ];
        return searchableFields.some(field =>
          field && field.toLowerCase().includes(query)
        );
      });
    }

    return data;
  };

  const filteredData = getFilteredData();

  const renderRideItem = (ride) => {
    const status = getRideStatus(ride);
    console.log(status);
    return (
      <Card
        key={ride.rideId}
        sx={{
          mb: 2,
          backgroundColor: ride.canceled ? '#ffebee' : 'inherit',
          position: 'relative',
          overflow: 'visible'
        }}
      >
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
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="primary">
              RideId {ride.rideId}
            </Typography>
            <Chip
              label={getRideStatus(ride)}
              color={getRideStatusColor(getRideStatus(ride))}
              size="small"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              {ride.customerName && <Typography variant="body2" color="text.secondary">
                <strong>Customer:</strong> {ride.customerName}
              </Typography>}
              {ride.customerName && <Typography variant="body2" color="text.secondary">
                <strong>Customer #:</strong> {ride.customerPhoneNumber}
              </Typography>}
              <Typography variant="body2" color="text.secondary">
                <strong>Passengers:</strong> {ride.passengers || 1}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Car Type:</strong> {['Car', 'SUV', 'MiniVan', '12 Passenger', '15 Passenger', 'Luxury SUV'][ride.carType] || 'Car'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <LocationIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>From:</strong> {ride.route.pickup}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>To:</strong> {ride.route.dropOff}
                  </Typography>
                </Box>
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
            {ride.scheduledFor && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Scheduled:</strong> {formatDateTime(ride.scheduledFor)}
                </Typography>
              </Grid>
            )}
            {ride.callTime && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Call Time:</strong> {formatDateTime(ride.callTime)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>

        <CardActions sx={{ flexWrap: 'wrap', gap: 1, p: 2, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => onItemClick('ride', ride.rideId)}
          >
            View Details
          </Button>

          {/* Show Message button for all non-canceled rides that aren't completed (dropOffTime is null) */}
          {/* Use reassigned driver if ride was reassigned */}
          {(!ride.canceled && !ride.dropOffTime && ((ride.reassigned && ride.reassignedToId) || ride.assignedToId)) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<MessageIcon />}
              onClick={() => handleMessageDriver(null, null, ride)}
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
      </Card >
    )
  };

  const renderDriverItem = (driver) => {
    const status = driverStatuses[driver.id] || 'loading';
    const hasUnread = driversWithUnread.has(driver.id);

    return (
      <Card key={driver.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" color="primary">
                DriverId {driver.id}
              </Typography>
              {hasUnread && (
                <Badge color="error" variant="dot">
                  <UnreadIcon color="error" fontSize="small" />
                </Badge>
              )}
            </Box>
            <Chip
              label={status}
              color={getDriverStatusColor(status)}
              size="small"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {driver.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {driver.phoneNumber}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {driver.email}
                </Typography>
              </Box>
            </Grid>
            {/* <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                <strong>Currently Driving:</strong> {driver.isCurrentlyDriving ? 'Yes' : 'No'}
              </Typography>
            </Grid> */}
          </Grid>
        </CardContent>

        <CardActions sx={{ gap: 1, p: 2, pt: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => onItemClick('driver', driver.id)}
          >
            View Details
          </Button>

          <Button
            variant={hasUnread ? "contained" : "outlined"}
            size="small"
            color={hasUnread ? "error" : "primary"}
            startIcon={
              hasUnread ? (
                <Badge color="error" variant="dot">
                  <MessageIcon />
                </Badge>
              ) : (
                <MessageIcon />
              )
            }
            onClick={() => handleMessageDriver(driver.id, driver.name)}
          >
            {hasUnread ? "New Message!" : "Message Driver"}
          </Button>
        </CardActions>
      </Card>
    )
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBackToDashboard}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
          <Typography variant="h5" component="h2">
            {getTitle()}
          </Typography>
          <Chip
            label={`${Array.isArray(filteredData) ? filteredData.length : 0} of ${Array.isArray(data) ? data.length : 0} items`}
            color="primary"
          />
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder={isRideList ? "Search by ride ID, customer, phone, address..." : "Search by driver ID, name, phone, email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mt: 1 }}
        />
      </Paper>

      <Box>
        {loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Loading...
            </Typography>
          </Paper>
        ) : !Array.isArray(filteredData) || filteredData.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? `No results found for "${searchQuery}"` : `No ${getTitle().toLowerCase()} found.`}
            </Typography>
          </Paper>
        ) : (
          <Box>
            {isRideList && Array.isArray(filteredData) && filteredData.map(renderRideItem)}
            {isDriverList && Array.isArray(filteredData) && filteredData.map(renderDriverItem)}
          </Box>
        )}
      </Box>

      {/* Driver Messaging Modal */}
      <DriverMessagingModal
        isOpen={showMessaging}
        onClose={handleMessagingClose}
        driverId={messagingDriverId}
        driverName={messagingDriverName}
        rideContext={messagingRideContext}
        onNavigateToRideHistory={onNavigateToRideHistory}
      />
    </Box>
  );
};

export default MetricListView;