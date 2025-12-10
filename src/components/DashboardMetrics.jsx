import React, { useState, useEffect } from 'react';
import { ridesAPI, driversAPI } from '../services/apiService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Badge
} from '@mui/material';
import {
  DirectionsCar,
  Schedule,
  Today,
  Person,
  DriveEta,
  Assignment,
  Message as MessageIcon
} from '@mui/icons-material';

const DashboardMetrics = ({ onMetricClick, hasUnreadMessages = false }) => {
  const [metrics, setMetrics] = useState({
    assignedRides: [],
    ridesInProgress: [],
    openRides: [],
    futureRides: [],
    todaysRides: [],
    activeDrivers: [],
    driversCurrentlyDriving: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignedRides, ridesInProgress, openRides, futureRides, todaysRides, activeDrivers, driversCurrentlyDriving] = await Promise.all([
        ridesAPI.getAssigned(),
        ridesAPI.getInProgress(),
        ridesAPI.getOpen(),
        ridesAPI.getFuture(),
        ridesAPI.getToday(),
        driversAPI.getActive(),
        driversAPI.getDriving()
      ]);

      setMetrics({
        assignedRides: assignedRides || [],
        ridesInProgress: ridesInProgress || [],
        openRides: openRides || [],
        futureRides: futureRides || [],
        todaysRides: todaysRides || [],
        activeDrivers: activeDrivers || [],
        driversCurrentlyDriving: driversCurrentlyDriving || []
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricClick = (metricType, data) => {
    onMetricClick(metricType, data);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard metrics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadMetrics}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}
        justifyContent="center"
        sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* First Row - Current Rides */}

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'primary.main'
            }}
            onClick={() => handleMetricClick('assignedRides', metrics.assignedRides)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Assigned Rides
                </Typography>
                <Chip
                  label={(metrics.assignedRides || []).length}
                  color="primary"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Rides assigned to drivers but not yet started
              </Typography>
              <Assignment sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'warning.main'
            }}
            onClick={() => handleMetricClick('ridesInProgress', metrics.ridesInProgress)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Rides in Progress
                </Typography>
                <Chip
                  label={(metrics.ridesInProgress || []).length}
                  color="warning"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Rides currently being driven
              </Typography>
              <DirectionsCar sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'warning.main'
            }}
            onClick={() => handleMetricClick('openRides', metrics.openRides)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Open Rides
                </Typography>
                <Chip
                  label={(metrics.openRides || []).length}
                  color="warning"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Rides currently open and not yet assigned to drivers
              </Typography>
              <DirectionsCar sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Second Row - Scheduled & Today's Rides */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'info.main'
            }}
            onClick={() => handleMetricClick('futureRides', metrics.futureRides)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Future Rides
                </Typography>
                <Chip
                  label={(metrics.futureRides || []).length}
                  color="info"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Scheduled rides for future dates
              </Typography>
              <Schedule sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'success.main'
            }}
            onClick={() => handleMetricClick('todaysRides', metrics.todaysRides)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Today's Rides
                </Typography>
                <Chip
                  label={(metrics.todaysRides || []).length}
                  color="success"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                All rides created or scheduled for today
              </Typography>
              <Today sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Third Row - Drivers */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'secondary.main'
            }}
            onClick={() => handleMetricClick('activeDrivers', metrics.activeDrivers)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" component="h3">
                    Active Drivers
                  </Typography>
                  {hasUnreadMessages && (
                    <Badge
                      color="error"
                      variant="dot"
                      sx={{ '& .MuiBadge-dot': { width: 10, height: 10 } }}
                    >
                      <MessageIcon color="error" fontSize="small" />
                    </Badge>
                  )}
                </Box>
                <Chip
                  label={(metrics.activeDrivers || []).length}
                  color="secondary"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Drivers currently available for dispatch
              </Typography>
              <Person sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'error.main'
            }}
            onClick={() => handleMetricClick('driversCurrentlyDriving', metrics.driversCurrentlyDriving)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Drivers Currently Driving
                </Typography>
                <Chip
                  label={(metrics.driversCurrentlyDriving || []).length}
                  color="error"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Drivers currently on active rides
              </Typography>
              <DriveEta sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          onClick={loadMetrics}
          variant="contained"
          color="primary"
          size="large"
        >
          Refresh Metrics
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardMetrics;