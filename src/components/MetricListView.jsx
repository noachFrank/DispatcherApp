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
  Badge,
  Collapse,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { formatDateTime } from '../utils/dateHelpers';
import {
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  Cancel as CancelIcon,
  SwapHoriz as ReassignIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MarkEmailUnread as UnreadIcon,
  RestartAlt as ResetIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Repeat as RepeatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as SettlementIcon
} from '@mui/icons-material';
import DriverMessagingModal from './DriverMessagingModal';
import { dashboardAPI, driversAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { getRideStatus, getRideStatusColor, getRideStatusStyle, getDriverStatusColor } from '../utils/Status';
import { useNavigate, useLocation } from 'react-router-dom';

const MetricListView = ({
  isAdmin = false,
  metricType,
  data: initialData,
  onItemClick,
  onBackToDashboard,
  driversWithUnread = new Map(),
  onMarkMessagesRead,
  onMessagingModalClose,
  onNavigateToRideHistory,
  openMessagingModal,
  openMessagingDriverId
}) => {
  const { signalRConnection } = useAuth();
  const { showAlert, showToast } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(initialData || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingDriverId, setMessagingDriverId] = useState(null);
  const [messagingDriverName, setMessagingDriverName] = useState('');
  const [messagingRideContext, setMessagingRideContext] = useState(null); // { rideId, customerName, customerPhone }
  const [driverStatuses, setDriverStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingPriceRideId, setEditingPriceRideId] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDriverComp, setEditedDriverComp] = useState('');

  // Unsettled drivers state
  const [unsettledRidesCounts, setUnsettledRidesCounts] = useState({}); // {driverId: count}
  const [expandedDrivers, setExpandedDrivers] = useState(new Set());
  const [unsettledRidesMap, setUnsettledRidesMap] = useState({}); // {driverId: rides[]}
  const [loadingUnsettledRides, setLoadingUnsettledRides] = useState({});
  const [settlingDrivers, setSettlingDrivers] = useState({});
  const [settlingRides, setSettlingRides] = useState({});

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
            fetchedData = await dashboardAPI.getAssignedRides();
            break;
          case 'ridesInProgress':
            fetchedData = await dashboardAPI.getRidesInProgress();
            break;
          case 'openRides':
            fetchedData = await dashboardAPI.getOpenRides();
            break;
          case 'recurringRidesThisWeek':
            fetchedData = await dashboardAPI.getRecurringRidesThisWeek();
            break;
          case 'todaysRides':
            fetchedData = await dashboardAPI.getTodaysRides();
            break;
          case 'activeDrivers':
            fetchedData = await dashboardAPI.getActiveDrivers();
            break;
          case 'driversOnJob':
            fetchedData = await dashboardAPI.getDriversOnJob();
            break;
          case 'unsettledDrivers':
            fetchedData = await dashboardAPI.getUnsettledDrivers();
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

  // Fetch unsettled rides counts for unsettledDrivers view
  useEffect(() => {
    const fetchUnsettledRidesCounts = async () => {
      if (metricType === 'unsettledDrivers' && Array.isArray(data) && data.length > 0) {
        const countPromises = data.map(async (driver) => {
          try {
            const rides = await dashboardAPI.getUnsettledRidesByDriver(driver.id);
            return { id: driver.id, count: rides?.length || 0 };
          } catch (error) {
            console.error(`Failed to fetch unsettled rides for driver ${driver.id}:`, error);
            return { id: driver.id, count: 0 };
          }
        });

        const results = await Promise.all(countPromises);
        const countsMap = {};
        results.forEach(({ id, count }) => {
          countsMap[id] = count;
        });

        setUnsettledRidesCounts(countsMap);
      }
    };

    fetchUnsettledRidesCounts();
  }, [data, metricType]);

  // Toggle driver expansion and load their unsettled rides
  const toggleDriverExpand = async (driverId) => {
    const isExpanded = expandedDrivers.has(driverId);

    if (isExpanded) {
      setExpandedDrivers(prev => {
        const newSet = new Set(prev);
        newSet.delete(driverId);
        return newSet;
      });
    } else {
      setExpandedDrivers(prev => new Set([...prev, driverId]));

      if (!unsettledRidesMap[driverId]) {
        setLoadingUnsettledRides(prev => ({ ...prev, [driverId]: true }));
        try {
          const rides = await dashboardAPI.getUnsettledRidesByDriver(driverId);
          setUnsettledRidesMap(prev => ({ ...prev, [driverId]: rides || [] }));
        } catch (error) {
          console.error('Error loading unsettled rides:', error);
        } finally {
          setLoadingUnsettledRides(prev => ({ ...prev, [driverId]: false }));
        }
      }
    }
  };

  const calculateUnsettledAmount = (ride) => {
    const cost = ride.cost || 0;
    const driversComp = ride.driversCompensation || 0;

    //console.log(`Calculating unsettled amount for Ride #${ride.rideId}: Cost=$${cost}, Driver's Comp=$${driversComp}, Diff=$${cost - driversComp}, PaymentType=${ride.paymentType}`);
    if (ride.paymentType === 'cash' || ride.paymentType === 'zelle') {
      return - (ride.cost - ride.driversCompensation);
    } else {
      return ride.driversCompensation;
    }
  };

  // Settle all rides for a driver
  const handleSettleDriver = async (driverId) => {
    setSettlingDrivers(prev => ({ ...prev, [driverId]: true }));
    try {
      await dashboardAPI.settleDriver(driverId);
      showToast('Driver settled successfully', 'success');
      // Remove driver from list
      setData(prev => prev.filter(d => d.id !== driverId));
      // Clear their data
      setUnsettledRidesMap(prev => {
        const newMap = { ...prev };
        delete newMap[driverId];
        return newMap;
      });
      setUnsettledRidesCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[driverId];
        return newCounts;
      });
    } catch (error) {
      console.error('Error settling driver:', error);
      showAlert('Error', 'Failed to settle driver. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setSettlingDrivers(prev => ({ ...prev, [driverId]: false }));
    }
  };

  // Settle a single ride
  const handleSettleRide = async (driverId, rideId) => {
    setSettlingRides(prev => ({ ...prev, [rideId]: true }));
    try {
      await dashboardAPI.settleRide(rideId);
      showToast('Ride settled successfully', 'success');
      // Remove ride from driver's list
      setUnsettledRidesMap(prev => ({
        ...prev,
        [driverId]: (prev[driverId] || []).filter(r => r.rideId !== rideId)
      }));
      // Update count
      setUnsettledRidesCounts(prev => ({
        ...prev,
        [driverId]: Math.max(0, (prev[driverId] || 1) - 1)
      }));
      // If no more rides, remove driver from list
      const remainingRides = (unsettledRidesMap[driverId] || []).filter(r => r.rideId !== rideId);
      if (remainingRides.length === 0) {
        setData(prev => prev.filter(d => d.id !== driverId));
      }
    } catch (error) {
      console.error('Error settling ride:', error);
      showAlert('Error', 'Failed to settle ride. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setSettlingRides(prev => ({ ...prev, [rideId]: false }));
    }
  };

  const handleCancelCall = async (callId) => {
    showAlert(
      'Cancel Call',
      'Are you sure you want to cancel this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              if (signalRConnection && signalRConnection.state === 'Connected') {
                console.log('Cancelling call via SignalR:', callId);
                await signalRConnection.invoke("CallCanceled", callId);
              } else {
                const state = signalRConnection?.state || 'Not initialized';
                console.warn('SignalR not connected, state:', state);
                showAlert('Connection Error', `SignalR not connected (${state}). Please refresh the page and try again.`, [{ text: 'OK' }], 'error');
                return;
              }
              showToast('Call cancelled successfully', 'success');
              // Refresh the data
              window.location.reload();
            } catch (error) {
              console.error('Failed to cancel call:', error);
              showAlert('Error', `Failed to cancel call: ${error.message}`, [{ text: 'OK' }], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleReassignCall = async (callId) => {
    showAlert(
      'Reassign Call',
      'Are you sure you want to reassign this call? The driver will be removed and the call will become available again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reassign',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use SignalR to notify about reassignment - this will:
              // 1. Update the database
              // 2. Notify the assigned driver that they've been removed
              // 3. Broadcast to all available drivers that the call is available
              // 4. Notify all dispatchers about the change
              if (signalRConnection && signalRConnection.state === 'Connected') {
                console.log('Reassigning call via SignalR:', callId);
                await signalRConnection.invoke("CallDriverCancelled", callId);
              } else {
                const state = signalRConnection?.state || 'Not initialized';
                console.warn('SignalR not connected, state:', state);
                showAlert('Connection Error', `SignalR not connected (${state}). Please refresh the page and try again.`, [{ text: 'OK' }], 'error');
                return;
              }

              showToast('Call reassigned successfully', 'success');
              window.location.reload();

            } catch (error) {
              console.error('Failed to reassign call:', error);
              showAlert('Error', `Failed to reassign call: ${error.message}`, [{ text: 'OK' }], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleResetPickupTime = async (callId) => {
    showAlert(
      'Reset Pickup Time',
      'Are you sure you want to reset the pickup time for this call? The driver will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (signalRConnection && signalRConnection.state === 'Connected') {
                console.log('Resetting pickup time via SignalR:', callId);
                await signalRConnection.invoke("ResetPickupTime", callId);
              } else {
                const state = signalRConnection?.state || 'Not initialized';
                console.warn('SignalR not connected, state:', state);
                showAlert('Connection Error', `SignalR not connected (${state}). Please refresh the page and try again.`, [{ text: 'OK' }], 'error');
                return;
              }

              showToast('Pickup time reset and driver notified', 'success');
              // Refresh the data
              window.location.reload();

            } catch (error) {
              console.error('Failed to reset pickup time:', error);
              showAlert('Error', `Failed to reset pickup time: ${error.message}`, [{ text: 'OK' }], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleMessageDriver = (driverId, driverName, ride = null) => {
    // If messaging from a ride, determine the correct driver ID
    // If ride.Reassigned is true, use ride.ReassignedToId, else use ride.AssignedToId
    let targetDriverId = driverId;

    if (ride) {
      targetDriverId = ride.reassigned ? ride.reassignedToId : ride.assignedToId;
    }

    // Mark messages from this driver as read
    if (onMarkMessagesRead && targetDriverId) {
      onMarkMessagesRead(targetDriverId);
    }

    // Use the openMessagingModal function passed from parent if available
    if (openMessagingModal) {
      openMessagingModal(targetDriverId);
    } else {
      // Fallback to old approach (shouldn't happen)
      setMessagingDriverId(targetDriverId);
      setMessagingDriverName(driverName || `Driver #${targetDriverId}`);
      setMessagingRideContext(ride ? {
        rideId: ride.rideId,
        customerName: ride.customerName,
        customerPhone: ride.customerPhoneNumber
      } : null);
      setShowMessaging(true);
    }
  };

  const handleMessagingClose = () => {
    setShowMessaging(false);
    setMessagingDriverId(null);
    setMessagingDriverName('');
    setMessagingRideContext(null);

    // Notify parent that modal is closed
    if (onMessagingModalClose) {
      onMessagingModalClose();
    }
  };

  const handleEditPrice = (rideId, currentPrice, currentDriverComp) => {
    setEditingPriceRideId(rideId);
    setEditedPrice(currentPrice.toString());
    setEditedDriverComp(currentDriverComp.toString());
  };

  const handleCancelEditPrice = () => {
    setEditingPriceRideId(null);
    setEditedPrice('');
    setEditedDriverComp('');
  };

  const handleSavePrice = async (rideId) => {
    const newPrice = parseFloat(editedPrice);
    const newDriverComp = parseFloat(editedDriverComp);

    if (isNaN(newPrice) || newPrice < 0) {
      showAlert('Error', 'Please enter a valid price', [{ text: 'OK' }], 'error');
      return;
    }

    if (isNaN(newDriverComp) || newDriverComp < 0) {
      showAlert('Error', 'Please enter a valid driver compensation', [{ text: 'OK' }], 'error');
      return;
    }

    try {
      await ridesAPI.updatePrice(rideId, newPrice, newDriverComp);

      // Update local data
      setData(prevData =>
        prevData.map(ride =>
          ride.rideId === rideId ? { ...ride, cost: newPrice, driversCompensation: newDriverComp } : ride
        )
      );

      showToast('Price updated successfully', 'success');
      setEditingPriceRideId(null);
      setEditedPrice('');
      setEditedDriverComp('');
    } catch (error) {
      console.error('Error updating price:', error);
      showAlert('Error', 'Failed to update price. Please try again.', [{ text: 'OK' }], 'error');
    }
  };

  const handleCancelRecurring = async (rideId) => {
    showAlert(
      'Cancel Recurring Ride',
      'This will stop this ride from recurring in the future. The current instance will remain. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Cancel Series',
          onPress: async () => {
            try {
              await ridesAPI.cancelRecurring(rideId);

              // Update local data to mark as no longer recurring
              setData(prevData =>
                prevData.map(ride =>
                  ride.rideId === rideId ? { ...ride, isRecurring: false } : ride
                )
              );

              showToast('Recurring ride series canceled', 'success');
            } catch (error) {
              console.error('Error canceling recurring ride:', error);
              showAlert('Error', 'Failed to cancel recurring ride. Please try again.', [{ text: 'OK' }], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  const getTitle = () => {
    switch (metricType) {
      case 'assignedRides':
        return 'Assigned Rides';
      case 'ridesInProgress':
        return 'Rides in Progress';
      case 'openRides':
        return 'Open Rides';
      case 'recurringRidesThisWeek':
        return 'Recurring Rides This Week';
      case 'todaysRides':
        return 'Today\'s Rides';
      case 'activeDrivers':
        return 'Active Drivers';
      case 'driversOnJob':
        return 'Drivers On Job';
      case 'unsettledDrivers':
        return 'Unsettled Drivers';
      default:
        return 'List View';
    }
  };

  const isRideList = metricType?.includes('Rides') || metricType?.includes('rides');
  const isDriverList = (metricType?.includes('Drivers') || metricType?.includes('drivers')) && metricType !== 'unsettledDrivers';
  const isUnsettledDriversList = metricType === 'unsettledDrivers';

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

    if (isUnsettledDriversList) {
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
    console.log('recurring:', ride.isRecurring, ride.recurringId);
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
              Ride Id #{ride.rideId}
            </Typography>
            <Chip
              label={status}
              color={getRideStatusColor(status)}
              size="small"
              sx={getRideStatusStyle(status)}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              {ride.customerName && <Typography variant="body2" color="text.secondary">
                👨‍👩‍👧‍👦 <strong>Customer:</strong> {ride.customerName}
              </Typography>}
              {ride.customerPhoneNumber && <Typography variant="body2" color="text.secondary">
                ☎️ <strong>Phone #:</strong> {ride.customerPhoneNumber}
              </Typography>}
            </Grid>

            {/* Driver section */}
            {((!ride.reassigned && ride.assignedToId) || ride.reassignedToId) && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  🚘 <strong>Driver:</strong> #{ride.reassigned ? ride.reassignedToId : ride.assignedToId} - {ride.reassigned ? ride.reassignedTo?.name : ride.assignedTo?.name}
                </Typography>
                {(ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber) && (
                  <Typography variant="body2" color="text.secondary">
                    ☎️ <strong>Driver Phone #:</strong> {ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber}
                  </Typography>
                )}
              </Grid>
            )}

            {/* Cost and Driver's Compensation - Admin Only */}
            {isAdmin && (
              <Grid item xs={12}>
                {editingPriceRideId === ride.rideId ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        size="small"
                        type="number"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                        label="Cost"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ width: '150px' }}
                        autoFocus
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={editedDriverComp}
                        onChange={(e) => setEditedDriverComp(e.target.value)}
                        label="Driver Comp"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ width: '150px' }}
                      />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleSavePrice(ride.rideId)}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancelEditPrice}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        💵 <strong>Cost:</strong> ${ride.cost || 0}
                      </Typography>
                      {!ride.dropOffTime && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditPrice(ride.rideId, ride.cost || 0, ride.driversCompensation || 0)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      💰 <strong>Driver Comp:</strong> ${ride.driversCompensation || 0}
                    </Typography>
                  </Box>
                )}
              </Grid>
            )}


            {/* Times section */}
            <Grid item xs={12}>
              {ride.callTime && (
                <Typography variant="body2" color="text.secondary">
                  📞 <strong>Call Time:</strong> {formatDateTime(ride.callTime)}
                </Typography>
              )}
              {ride.scheduledFor && (
                <Typography variant="body2" color="text.secondary">
                  🗓️ <strong>Scheduled:</strong> {formatDateTime(ride.scheduledFor)}
                </Typography>
              )}

            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color={ride.pickupTime ? "success.main" : "error.main"}>
                <strong>Picked Up?</strong> {ride.pickupTime ? '✅' : '❌'}
              </Typography>

              <Typography variant="body2" color={ride.dropOffTime ? "success.main" : "error.main"}>
                <strong>Dropped Off?</strong> {ride.dropOffTime ? '✅' : '❌'}
              </Typography>
            </Grid>

            {/* Canceled indicator */}
            {ride.canceled && (
              <Grid item xs={12}>
                <Typography variant="body2" color="error.main">
                  ❌ <strong>Canceled</strong>
                </Typography>
              </Grid>
            )}

            {/* Recurring indicator */}
            {ride.isRecurring && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <RepeatIcon fontSize="small" color="primary" />
                  <Typography variant="body2" color="primary.main">
                    <strong>Recurring Ride</strong>
                  </Typography>
                </Box>
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
          {(!ride.canceled && !ride.dropOffTime && ((!ride.reassigned && ride.assignedToId) || ride.reassignedToId)) && (
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

          {(ride.pickupTime && !ride.dropOffTime) && (

            <Button
              variant="outlined"
              size="small"
              color='error'
              startIcon={<ResetIcon />}
              onClick={() => handleResetPickupTime(ride.rideId)}
            >
              Reset Pickup Time
            </Button>
          )}

          {/* Cancel Recurring button - only show for recurring rides */}
          {ride.isRecurring && !ride.canceled && !ride.dropOffTime && (
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<RepeatIcon />}
              onClick={() => handleCancelRecurring(ride.rideId)}
            >
              Cancel Recurring
            </Button>
          )}
        </CardActions>
      </Card >
    )
  };

  const renderDriverItem = (driver) => {
    const status = driverStatuses[driver.id] || 'loading';
    const unreadCount = driversWithUnread.get(driver.id) || 0;

    return (
      <Card key={driver.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" color="primary">
                Driver Id #{driver.id}
              </Typography>
              {!!unreadCount && (
                <Badge color="error" variant="dot">
                  <UnreadIcon color="error" fontSize="small" />
                </Badge>
              )}
            </Box>
            <Chip
              label={status}
              color={getDriverStatusColor(status)}
              size="small"
              sx={getRideStatusStyle(status)}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                🙎‍♂️ <strong>Name:</strong> {driver.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                ☎️ <strong>Phone #:</strong> {driver.phoneNumber}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                📧 <strong>Email:</strong> {driver.email}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                🚗 Has  {driver.cars?.length ?? 0} Car{driver.cars?.length === 1 ? '' : 's'}
              </Typography>
            </Grid>
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

          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<MessageIcon />}
              onClick={() => handleMessageDriver(driver.id, driver.name)}
            >
              Message Driver
            </Button>
          </Badge>
        </CardActions>
      </Card>
    )
  };

  // Render unsettled driver item - similar to renderDriverItem but with unsettled rides section
  const renderUnsettledDriverItem = (driver) => {
    const status = driverStatuses[driver.id] || 'loading';
    const unreadCount = driversWithUnread.get(driver.id) || 0;
    const unsettledCount = unsettledRidesCounts[driver.id];
    const isExpanded = expandedDrivers.has(driver.id);
    const rides = unsettledRidesMap[driver.id] || [];
    const isLoadingRides = loadingUnsettledRides[driver.id];
    const isSettling = settlingDrivers[driver.id];

    // Calculate total amounts
    let totalOwedToDriver = 0; // Company owes driver (CC payments)
    let totalOwedByDriver = 0; // Driver owes company (Cash/Other)
    rides.forEach(ride => {

      if (ride.paymentType === 'cash' || ride.paymentType === 'zelle') {
        totalOwedByDriver += (ride.cost - ride.driversCompensation);
      } else {
        totalOwedToDriver += ride.driversCompensation;
      }
    });

    return (
      <Card key={driver.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" color="primary">
                Driver Id #{driver.id}
              </Typography>
              {unsettledCount !== undefined && (
                <Chip
                  size="small"
                  label={`${unsettledCount} unsettled`}
                  color={`${unsettledCount >= 20 ? 'error' : unsettledCount >= 10 ? 'warning' : 'default'}`}
                  icon={<SettlementIcon />}
                />
              )}
              {!!unreadCount && (
                <Badge color="error" variant="dot">
                  <UnreadIcon color="error" fontSize="small" />
                </Badge>
              )}
            </Box>
            <Chip
              label={status}
              color={getDriverStatusColor(status)}
              size="small"
              sx={getRideStatusStyle(status)}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                🙎‍♂️ <strong>Name:</strong> {driver.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                ☎️ <strong>Phone #:</strong> {driver.phoneNumber}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                📧 <strong>Email:</strong> {driver.email}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ gap: 1, p: 2, pt: 0, flexDirection: 'column', alignItems: 'stretch' }}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              onClick={() => onItemClick('driver', driver.id)}
            >
              View Details
            </Button>

            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<MessageIcon />}
                onClick={() => handleMessageDriver(driver.id, driver.name)}
              >
                Message Driver
              </Button>
            </Badge>

            <Button
              variant="outlined"
              size="small"
              onClick={() => toggleDriverExpand(driver.id)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {isExpanded ? 'Hide Unsettled Rides' : 'Show Unsettled Rides'}
            </Button>
          </Box>

          {/* Collapsible unsettled rides section */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit sx={{ width: '100%', mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {isLoadingRides ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : rides.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No unsettled rides found.
              </Typography>
            ) : (
              <>
                {/* Summary */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    💰 Settlement Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="success.main">
                        <strong>Company owes driver:</strong> ${totalOwedToDriver.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="error.main">
                        <strong>Driver owes company:</strong> ${totalOwedByDriver.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1" fontWeight="bold">
                        Net: {totalOwedToDriver > totalOwedByDriver ? (
                          <span style={{ color: 'green' }}>Pay driver ${(totalOwedToDriver - totalOwedByDriver).toFixed(2)}</span>
                        ) : totalOwedByDriver > totalOwedToDriver ? (
                          <span style={{ color: 'red' }}>Collect ${(totalOwedByDriver - totalOwedToDriver).toFixed(2)} from driver</span>
                        ) : (
                          <span>Even - $0.00</span>
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Rides table */}
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Ride ID</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Payment</strong></TableCell>
                        <TableCell align="right"><strong>Cost</strong></TableCell>
                        <TableCell align="right"><strong>Driver Comp</strong></TableCell>
                        <TableCell align="right"><strong>Unsettled Amt</strong></TableCell>
                        <TableCell align="center"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rides.map((ride) => {
                        const amount = calculateUnsettledAmount(ride);
                        const isSettlingRide = settlingRides[ride.rideId];
                        return (
                          <TableRow key={ride.rideId} hover>
                            <TableCell>{ride.rideId}</TableCell>
                            <TableCell>
                              {ride.scheduledFor ? formatDateTime(ride.scheduledFor) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={ride.paymentType === 'dispatcherCC' ? 'CC on file' : ride.paymentType}
                                color={ride.paymentType === 'dispatcherCC' || ride.paymentType === 'driverCC' ? 'primary' : ride.paymentType === 'cash' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">${(ride.cost || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">${(ride.driversCompensation || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={ride.paymentType === 'cash' || ride.paymentType === 'zelle' ? 'error.main' : 'success.main'}
                              >
                                ${ride.paymentType === 'cash' || ride.paymentType === 'zelle' ? (
                                  (ride.cost - ride.driversCompensation).toFixed(2)) : (
                                  ride.driversCompensation.toFixed(2))}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSettleRide(driver.id, ride.rideId)}
                                disabled={isSettlingRide}
                                startIcon={isSettlingRide ? <CircularProgress size={14} /> : <CheckIcon />}
                              >
                                Settle
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Settle All button */}
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleSettleDriver(driver.id)}
                  disabled={isSettling}
                  startIcon={isSettling ? <CircularProgress size={20} color="inherit" /> : <SettlementIcon />}
                >
                  {isSettling ? 'Settling...' : `Settle All (${rides.length} rides)`}
                </Button>
              </>
            )}
          </Collapse>
        </CardActions>
      </Card>
    );
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
            {isUnsettledDriversList && Array.isArray(filteredData) && filteredData.map(renderUnsettledDriverItem)}
          </Box>
        )}
      </Box>

      {/* Driver Messaging Modal */}
      <DriverMessagingModal
        isOpen={showMessaging || !!openMessagingDriverId}
        onClose={handleMessagingClose}
        driverId={openMessagingDriverId || messagingDriverId}
        driverName={messagingDriverName}
        rideContext={messagingRideContext}
        onNavigateToRideHistory={onNavigateToRideHistory}
      />
    </Box>
  );
};

export default MetricListView;