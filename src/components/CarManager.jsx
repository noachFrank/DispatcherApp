import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/adminService';

const CarManager = ({ driverId, driverName, onClose }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    vin: ''
  });

  useEffect(() => {
    loadCars();
  }, [driverId]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.cars.getByDriver(driverId);
      console.log('Loaded cars data:', data);
      // Ensure data is always an array
      const carsArray = Array.isArray(data) ? data : [];

      setCars(carsArray);
    } catch (error) {
      console.error('Failed to load cars:', error);
      // Set empty array on error
      setCars([]);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <div className="loading">Loading cars...</div>;
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onClose}
              variant="outlined"
            >
              Back to Drivers
            </Button>
            <Typography variant="h5" component="h2">
              Cars for {driverName}
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Box>
        {!Array.isArray(cars) || cars.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <CarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No cars found for this driver.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {cars.map(car => (
              <Grid item xs={12} sm={6} lg={4} key={car.carId}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: car.isPrimary ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  position: 'relative'
                }}>
                  {car.isPrimary && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    >
                      <Chip
                        icon={<StarIcon />}
                        label="Primary"
                        color="primary"
                        size="small"
                        variant="filled"
                      />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" color="primary">
                      CarId {car.carId}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CarIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                        </Box>
                        <Typography variant="body1">{car.make || 'N/A'} {car.model || ''} {`(${car.year})` || ''}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">License  Plate Number:</Typography>
                        <Typography variant="body1">{car.licensePlate || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Color:</Typography>
                        <Typography variant="body1">{car.color || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Type:</Typography>
                        <Typography variant="body1">{car.type || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default CarManager;