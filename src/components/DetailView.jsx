import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import { formatDateTime, formatDate, formatTimeOnly } from '../utils/dateHelpers';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import { ridesAPI, driversAPI } from '../services/apiService';
import { getRideStatus, getRideStatusColor, getRideStatusStyle, getDriverStatusColor } from '../utils/Status';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

const DetailView = ({ isAdmin = false, itemType, itemId, onBackToList }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { signalRConnection } = useAuth();
  const { showToast } = useAlert();

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  };

  useEffect(() => {
    loadItemDetails();
  }, [itemType, itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (itemType === 'ride') {
        data = await ridesAPI.getById(itemId);
        const rideStatus = getRideStatus(data);
        setStatus(rideStatus);
      } else if (itemType === 'driver') {
        data = await driversAPI.getById(itemId);
        console.log('driver data:', data);
        const driverStatus = await driversAPI.getDriverStatus(data.id);
        setStatus(driverStatus);
      }
      console.log(`${itemType} details:`, data);
      setItem(data);
    } catch (err) {
      console.error(`Failed to load ${itemType} details:`, err);
      setError(`Failed to load ${itemType} details`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyDriverToAddCar = async () => {
    try {
      setSendingMessage(true);
      if (!signalRConnection) {
        throw new Error('SignalR not connected. Please refresh the page.');
      }
      await signalRConnection.invoke('DispatcherSendsMessage', {
        DriverId: item.id,
        Message: 'Please add a vehicle to your account in order to view and accept open calls. Go to Settings > Car Management to add your vehicle information.',
      });

      showToast('Driver was notified to add a vehicle', 'success')
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send notification', 'error')
    } finally {
      setSendingMessage(false);
    }
  };


  const renderRideDetails = (ride) => (
    console.log('ride details', ride),
    <Grid spacing={4} justifyContent='center'>

      <Grid container spacing={3} sx={{ mb: 2 }} justifyContent='center'>
        {/* Ride Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Ride Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Ride Id</strong> #{ride.rideId}
                  </Typography>
                  <Typography variant="body1" color="text.secondary"><strong>Status: </strong>
                    <Chip
                      label={status}
                      color={getRideStatusColor(status)}
                      size="small"
                      sx={getRideStatusStyle(status)}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" color="text.secondary">
                    👥 <strong>Passengers:</strong> {ride.passengers || 1}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    🚗 <strong>Car Type:</strong> {['Car', 'SUV', 'MiniVan', '12 Passenger', '15 Passenger', 'Luxury SUV'][ride.carType] || 'Car'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    💺 <strong>Requires Car Seat: </strong> {ride.requiresCarSeat ? '✅' : '❌'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  {ride.callTime && (
                    <Typography variant="body1" color="text.secondary">
                      📞 <strong>Call Time:</strong> {formatDateTime(ride.callTime)}
                    </Typography>
                  )}
                  {ride.scheduledFor && (
                    <Typography variant="body1" color="text.secondary">
                      🗓️ <strong>Scheduled:</strong> {formatDateTime(ride.scheduledFor)}
                    </Typography>
                  )}
                  {ride.pickupTime && (
                    <Typography variant="body1  " color="success.main">
                      ✅ <strong>Picked Up:</strong> {formatDateTime(ride.pickupTime)}
                    </Typography>
                  )}
                  {ride.dropOffTime && (
                    <Typography variant="body1" color="success.main">
                      ✅ <strong>Dropped Off:</strong> {formatDateTime(ride.dropOffTime)}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Customer Information
              </Typography>
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  👨‍👩‍👧‍👦 <strong>Customer:</strong> {ride.customerName === '' ? 'N/A' : ride.customerName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  ☎️ <strong>Phone #:</strong> {formatPhoneNumber(ride.customerPhoneNumber)}
                </Typography>
                {ride.flightNumber && (
                  <Typography variant="body1" color="text.secondary">
                    ✈️ <strong>Flight Number:</strong> {ride.flightNumber}
                  </Typography>
                )}
                <Typography variant="body1" color="text.secondary">
                  📝 <strong>Notes:</strong> {ride.notes === '' ? 'N/A' : ride.notes}
                </Typography>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 2 }} justifyContent='center'>
        {/* Driver Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {<Typography variant="h6" gutterBottom color="primary">
                Driver Information
              </Typography>}
              <Grid item xs={12}>
                {((!ride.reassigned && ride.assignedToId) || ride.reassignedToId) ? (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      🚘 <strong>Driver:</strong> #{ride.reassigned ? ride.reassignedToId : ride.assignedToId} - {ride.reassigned ? ride.reassignedTo?.name : ride.assignedTo?.name}
                    </Typography>
                    {(ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber) && (
                      <Typography variant="body1" color="text.secondary">
                        ☎️ <strong>Driver Phone #:</strong> {formatPhoneNumber(ride.reassigned ? ride.reassignedTo?.phoneNumber : ride.assignedTo?.phoneNumber)}
                      </Typography>
                    )}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    🚘 <strong>Unassigned</strong>
                  </Typography>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Route Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" color="primary">
                  Route Information
                </Typography>
                {ride.route?.roundTrip && (
                  <Chip
                    icon={<RepeatIcon />}
                    label="Round Trip"
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    📍 <strong>Pickup:</strong> {ride.route?.pickup || 'N/A'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    🏁 <strong>Dropoff:</strong> {ride.route?.dropOff || 'N/A'}
                  </Typography>

                </Box>
              </Grid>

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Show stops if any */}
      {ride.route?.stop1 && (
        <Grid container spacing={3} sx={{ mb: 2 }} justifyContent='center'>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Additional Stops
                </Typography>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {ride.route?.stop1 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 1:</strong> {ride.route.stop1}
                      </Typography>
                    )}
                    {ride.route?.stop2 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 2:</strong> {ride.route.stop2}
                      </Typography>
                    )}
                    {ride.route?.stop3 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 3:</strong> {ride.route.stop3}
                      </Typography>
                    )}
                    {ride.route?.stop4 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 4:</strong> {ride.route.stop4}
                      </Typography>
                    )}
                    {ride.route?.stop5 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 5:</strong> {ride.route.stop5}
                      </Typography>
                    )}
                    {ride.route?.stop6 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 6:</strong> {ride.route.stop6}
                      </Typography>
                    )}
                    {ride.route?.stop7 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 7:</strong> {ride.route.stop7}
                      </Typography>
                    )}
                    {ride.route?.stop8 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 8:</strong> {ride.route.stop8}
                      </Typography>
                    )}
                    {ride.route?.stop9 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 9:</strong> {ride.route.stop9}
                      </Typography>
                    )}
                    {ride.route?.stop10 && (
                      <Typography variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                        📌 <strong>Stop 10:</strong> {ride.route.stop10}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <Grid container spacing={3} sx={{ mb: 2 }} justifyContent='center'>
        {/* Recurring Ride Information Card */}
        {ride.isRecurring && ride.recurring && (
          <Grid item xs={12}>

            <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <RepeatIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    Recurring Ride Details
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      📅 <strong>Day of Week:</strong> {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][ride.recurring.dayOfWeek]}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      ⏰ <strong>Time:</strong> {formatTimeOnly(ride.recurring.time)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      🏁 <strong>End Date:</strong> {formatDate(ride.recurring.endDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      icon={<RepeatIcon />}
                      label={new Date(ride.recurring.endDate) > new Date() ? "Active Series" : "Series Ended"}
                      color={new Date(ride.recurring.endDate) > new Date() ? "success" : "default"}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 2 }} justifyContent='center'>
        {/* Payment Information Card */}
        <Grid item xs={12} >
          {isAdmin && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Payment Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          💵 <strong>Total Cost: </strong>
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          ${(ride.cost || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          💵 <strong>Driver's Comp: </strong>
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          ${(ride.driversCompensation || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Breakdown:
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Base Fare:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight="600">
                          ${(ride.cost - (ride.waitTimeAmount + ride.tip) || 0).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Company Profit:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight="600">
                          ${((ride.cost || 0) - (ride.driversCompensation || 0)).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Wait Time:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight="600">
                          ${((ride.waitTimeAmount || 0)).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tips:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight="600">
                          ${((ride.tip || 0)).toFixed(2)}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Payment Method:</strong>
                        </Typography>
                        <Chip
                          label={ride.paymentType || 'Cash'}
                          size="small"
                          color={ride.paymentType === 'Credit Card' ? 'primary' : 'default'}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

    </Grid>
  );


  const renderDriverDetails = (driver) => {
    return (
      <Grid container spacing={3} justifyContent='center'>
        {console.log('driver details', driver)}
        <Grid item xs={12} md={6}>
          {/* driver info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Driver Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1" color="text.secondary">
                    <strong>Driver ID #{driver.id}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" color="text.secondary">
                    🙎‍♂️<strong>Name: {driver.name}</strong>
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    🗓️ <strong>Driving Since:</strong> {formatDate(driver.joinedDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" color="text.secondary">
                    🛣️ <strong>Status: </strong>
                    <Chip
                      label={status}
                      color={getDriverStatusColor(status)}
                      size="small"
                      sx={getRideStatusStyle(status)}
                    />
                  </Typography>

                  <Typography variant="body1" color="text.secondary">
                    <strong>
                      {status === 'En-Route' ||
                        status === 'Driving'
                        ? '🚗 Currently Driving' : '⛔ Not Currently Driving'}
                    </strong>
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* contact info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body1" color="text.secondary">
                      📞 <strong>Phone</strong>
                    </Typography>
                  </Box>
                  <Typography variant="body1">{formatPhoneNumber(driver.phoneNumber)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body1" color="text.secondary">
                      📧 <strong>Email</strong>
                    </Typography>
                  </Box>
                  <Typography variant="body1">{driver.email || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} >
          {/* vehicle info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" align="center">
                Vehicle Information
              </Typography>
              {driver.cars && driver.cars.length > 0 ? (
                <Grid container spacing={3} justifyContent='center'>
                  {driver.cars.map((car, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper
                        elevation={car.isPrimary ? 3 : 1}
                        sx={{
                          p: 2,
                          pt: car.isPrimary ? 4 : 2,
                          border: car.isPrimary ? 2 : 0,
                          borderColor: car.isPrimary ? 'primary.main' : 'transparent',
                          position: 'relative'
                        }}
                      >
                        {car.isPrimary && (
                          <Chip
                            label="PRIMARY"
                            color="primary"
                            size="small"
                            sx={{ position: 'absolute', top: -10, right: 8 }}
                          />
                        )}
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                              🚘 <strong>Vehicle:</strong> {car.make || 'N/A'} {car.model || ''} {car.year ? `(${car.year})` : ''}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                              🪪 <strong>License Plate:</strong> {car.licensePlate || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                              🎨 <strong>Color:</strong> {car.color || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                              👥 <strong>Passengers:</strong> {car.seats || 1}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                              🚗 <strong>Car Type:</strong> {car.type || 'Car'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No vehicles registered
                  </Typography>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleNotifyDriverToAddCar}
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? 'Sending...' : 'Notify Driver to Add Vehicle'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid >
    )
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading {itemType} details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          onClick={onBackToList}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            onClick={onBackToList}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to List
          </Button>
          <Box display="flex" alignItems="center" gap={1}>
            {itemType === 'ride' ? <CarIcon /> : <PersonIcon />}
            <Typography variant="h5">
              {itemType === 'ride' ? `Ride Id #${item?.rideId}` : `Driver: ${item?.name}`}
            </Typography>
          </Box>
          <Button
            onClick={loadItemDetails}
            startIcon={<RefreshIcon />}
            variant="contained"
            color="primary"
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {itemType === 'ride' && item && renderRideDetails(item)}
      {itemType === 'driver' && item && renderDriverDetails(item)}
    </Box>
  );
};

export default DetailView;