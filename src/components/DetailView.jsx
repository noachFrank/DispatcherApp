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
import { formatDateTime, formatDate } from '../utils/dateHelpers';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { ridesAPI, driversAPI } from '../services/apiService';
import { getRideStatus, getRideStatusColor, getDriverStatusColor } from '../utils/Status';


const DetailView = ({ itemType, itemId, onBackToList }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

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

  const renderRideDetails = (ride) => (
    console.log('ride details', ride),
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Ride Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Ride ID:</Typography>
                <Typography variant="body1">#{ride.rideId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Chip
                  label={status}
                  color={getRideStatusColor(status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Passengers:</Typography>
                <Typography variant="body1">{ride.passengers || 1}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Car Type:</Typography>
                <Typography variant="body1">{['Car', 'SUV', 'MiniVan', '12 Passenger', '15 Passenger', 'Luxury SUV'][ride.carType] || 'Car'}</Typography>
              </Grid>
              {ride.scheduledFor === ride.callTime ? (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Created and Scheduled:</Typography>
                  <Typography variant="body1">
                    {ride.scheduledFor ? formatDateTime(ride.scheduledFor) : 'N/A'}
                  </Typography>
                </Grid>
              ) : (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Scheduled:</Typography>
                    <Typography variant="body1">
                      {ride.scheduledFor ? formatDateTime(ride.scheduledFor) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Created:</Typography>
                    <Typography variant="body1">
                      {ride.callTime ? formatDateTime(ride.callTime) : 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}

            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              {ride.customerName &&
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1">{ride.customerName || 'N/A'}</Typography>
                </Grid>
              }
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body1">{ride.customerPhoneNumber || 'N/A'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Route Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">Pickup Location:</Typography>
                </Box>
                <Typography variant="body1">{ride.route.pickup}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationIcon fontSize="small" color="error" />
                  <Typography variant="body2" color="text.secondary">Destination:</Typography>
                </Box>
                <Typography variant="body1">{ride.route.dropOff}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Driver & Payment
            </Typography>
            <Grid container spacing={2}>
              {ride.assignedToId &&
                <><Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Driver ID:</Typography>
                  <Typography variant="body1">{`#${ride.assignedToId}` || 'Unassigned'}</Typography>
                </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Driver Name:</Typography>
                    <Typography variant="body1">{ride.assignedTo?.name || 'N/A'}</Typography>
                  </Grid>
                </>
              }
              {((ride.reassigned && !ride.reassignedToId) || !ride.assignedToId) &&
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.warning">Unassigned</Typography>
                </Grid>
              }

              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Fare:</Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  ${ride.cost || 0}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Driver's Comp:</Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  ${ride.driversCompensation || 0}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDriverDetails = (driver) => {
    const primaryCar = driver.cars.find(c => c.isPrimary) ?? driver.cars[0];
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Driver Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Driver ID:</Typography>
                  <Typography variant="body1">#{driver.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1">{driver.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip
                    label={status}
                    color={getDriverStatusColor(status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Currently Driving:</Typography>
                  <Chip
                    label={status === 'En-Route' || status === 'Driving' || status === 'Active' ? 'Yes' : 'No'}
                    color={status === 'En-Route' || status === 'Driving' || status === 'Active' ? 'warning' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                  </Box>
                  <Typography variant="body1">{driver.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                  </Box>
                  <Typography variant="body1">{driver.email || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                  </Box>
                  <Typography variant="body1">{primaryCar?.make || 'N/A'} {primaryCar?.model || ''} {`(${primaryCar?.year})` || ''}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">License  Plate Number:</Typography>
                  <Typography variant="body1">{primaryCar?.licensePlate || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Color:</Typography>
                  <Typography variant="body1">{primaryCar?.color || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1">{primaryCar?.type || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Rating:</Typography>
                <Typography variant="body1" color="warning.main" fontWeight="bold">
                  {driver.rating ? `${driver.rating}/5.0` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Total Rides:</Typography>
                <Typography variant="body1" color="primary" fontWeight="bold">
                  {driver.totalRides || '0'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Joined Date:</Typography>
                <Typography variant="body1">
                  {driver.joinedDate ? formatDate(driver.joinedDate) : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid> */}
      </Grid>
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
              {itemType === 'ride' ? `RideId ${item?.rideId}` : `Driver: ${item?.name}`}
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