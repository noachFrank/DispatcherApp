import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/apiService';
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
  Message as MessageIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';

const DashboardMetrics = ({ onMetricClick, hasUnreadMessages = false }) => {
  const [metrics, setMetrics] = useState({
    assignedRides: [],
    openRides: [],
    ridesInProgress: [],
    recurringRidesThisWeek: [],
    todaysRides: [],
    activeDrivers: [],
    driversOnJob: []
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

      // Use the comprehensive dashboard endpoint
      const data = await dashboardAPI.getAll();

      setMetrics({
        assignedRides: data.assignedRides || [],
        openRides: data.openRides || [],
        ridesInProgress: data.ridesInProgress || [],
        recurringRidesThisWeek: data.recurringRidesThisWeek || [],
        todaysRides: data.todaysRides || [],
        activeDrivers: data.activeDrivers || [],
        driversOnJob: data.driversOnJob || []
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh individual metric
  const refreshMetric = async (metricName, apiCall) => {
    try {
      const data = await apiCall();
      setMetrics(prev => ({
        ...prev,
        [metricName]: data || []
      }));
    } catch (err) {
      console.error(`Failed to refresh ${metricName}:`, err);
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
        sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>
        {/* First Row - today & Recurring */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
              borderLeft: 4,
              borderLeftColor: 'info.main'
            }}
            onClick={() => handleMetricClick('recurringRidesThisWeek', metrics.recurringRidesThisWeek)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Recurring This Week
                </Typography>
                <Chip
                  label={(metrics.recurringRidesThisWeek || []).length}
                  color="info"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Recurring rides this week
              </Typography>
              <RepeatIcon sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
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
                Scheduled for today
              </Typography>
              <Today sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* First Row - Current Rides */}
      <Grid container spacing={3}
        justifyContent="center"
        sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>

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
                Assigned not started
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
                Rides not assigned
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
              borderLeftColor: 'error.main'
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
                  color="error"
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Picked up, not dropped off
              </Typography>
              <DirectionsCar sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Third Row - Drivers */}
      <Grid container spacing={3}
        justifyContent="center"
        sx={{ maxWidth: 900, mx: 'auto', mb: 4 }}>

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
                All available drivers
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
              borderLeftColor: '#9c27b0'
            }}
            onClick={() => handleMetricClick('driversOnJob', metrics.driversOnJob)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" component="h3">
                  Drivers On Job
                </Typography>
                <Chip
                  label={(metrics.driversOnJob || []).length}
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    bgcolor: '#9c27b0',
                    color: 'white'
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Currently on active calls
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