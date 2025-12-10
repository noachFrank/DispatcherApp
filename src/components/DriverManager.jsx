import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DirectionsCar as CarIcon,
  Message as MessageIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/adminService';
import CarManager from './CarManager';
import DriverMessagingModal from './DriverMessagingModal';

const DriverManager = ({ onNavigateToRideHistory }) => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showCarManager, setShowCarManager] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingDriverId, setMessagingDriverId] = useState(null);
  const [messagingDriverName, setMessagingDriverName] = useState('');
  const [driverUnreadCounts, setDriverUnreadCounts] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    license: '',
    userName: ''
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Phone number formatting
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return phoneNumber;
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Remove formatting and check if it's 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 10;
  };

  const validateLicense = (license) => {
    // License should be alphanumeric and 6-15 characters
    const licenseRegex = /^[A-Za-z0-9]{6,15}$/;
    return licenseRegex.test(license.replace(/[\s-]/g, ''));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.license.trim()) {
      errors.license = 'License number is required';
    } else if (!validateLicense(formData.license)) {
      errors.license = 'Please enter a valid license number (6-15 alphanumeric characters)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    loadDrivers();
    // Set up polling for unread message counts
    const interval = setInterval(loadUnreadCounts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const driversArray = Array.isArray(drivers) ? drivers : [];

    if (searchTerm) {
      const filtered = driversArray.filter(driver =>
        (driver.name && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (driver.userName && driver.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (driver.phoneNumber && driver.phoneNumber.includes(searchTerm)) ||
        (driver.license && driver.license.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(driversArray);
    }
  }, [searchTerm, drivers]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.drivers.getAll();

      const driversArray = Array.isArray(data) ? data : [];

      setDrivers(driversArray);
      setFilteredDrivers(driversArray);

      await loadUnreadCounts();
    } catch (error) {
      console.error('Failed to load drivers:', error);
      setDrivers([]);
      setFilteredDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const driversArray = Array.isArray(drivers) ? drivers : [];
      const counts = {};

      // Set unread counts to 0 for now - can be implemented later if needed
      driversArray.forEach((driver) => {
        counts[driver.id] = 0;
      });

      setDriverUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to load unread counts:', error);
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Format phone number as user types
    if (field === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      if (editingDriver) {
        await adminAPI.drivers.update(formData);
      } else {
        // Include empty password - server will generate the actual password
        const response = await adminAPI.drivers.create({ ...formData, password: '' });

        // Check if there was a warning (email failed to send)
        if (response && response.warning) {
          alert(`Warning: ${response.warning}\n\nTemporary Password: ${response.tempPassword}`);
        }
      }

      // Reload drivers and reset form
      await loadDrivers();
      resetForm();

    } catch (error) {
      console.error('Failed to save driver:', error);
      alert('Failed to save driver. Please try again.');
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      license: driver.license
    });
    setShowAddForm(true);
  };

  const handleViewCars = (driver) => {
    setSelectedDriverId(driver.id);
    setShowCarManager(true);
  };

  const handleMessage = (driver) => {
    setMessagingDriverId(driver.id);
    setMessagingDriverName(driver.name);
    setShowMessaging(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      license: ''
    });
    setValidationErrors({});
    setEditingDriver(null);
    setShowAddForm(false);
  };

  const handleCarManagerClose = () => {
    setShowCarManager(false);
    setSelectedDriverId(null);
  };

  const handleMessagingClose = () => {
    setShowMessaging(false);
    setMessagingDriverId(null);
    setMessagingDriverName('');
    // Refresh unread counts when closing messaging
    loadUnreadCounts();
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading drivers...
        </Typography>
      </Box>
    );
  }

  if (showCarManager) {
    return (
      <CarManager
        driverId={selectedDriverId}
        driverName={drivers.find(d => d.id === selectedDriverId)?.name}
        onClose={handleCarManagerClose}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          placeholder="Search drivers by name, email, phone, or license..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button
          onClick={() => setShowAddForm(true)}
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Driver
        </Button>
      </Box>

      <Dialog open={showAddForm} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </Typography>
            <IconButton onClick={resetForm}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              error={!!validationErrors.phoneNumber}
              helperText={validationErrors.phoneNumber}
              placeholder="(555) 123-4567"
              inputProps={{ maxLength: 14 }}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="License Number"
              value={formData.license}
              onChange={(e) => handleInputChange('license', e.target.value)}
              error={!!validationErrors.license}
              helperText={validationErrors.license}
              placeholder="ABC123DEF45"
              inputProps={{ maxLength: 15 }}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingDriver ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3 }}>
        {!Array.isArray(filteredDrivers) || filteredDrivers.length === 0 ? (
          <Box textAlign="center" py={5}>
            <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No drivers found.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredDrivers.map(driver => (
              <Grid item xs={12} sm={6} lg={4} key={driver.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h4" gutterBottom>
                      {driver.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {driver.email}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {driver.phoneNumber}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>License:</strong> {driver.license}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Joined:</strong> {new Date(driver.joinedDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      onClick={() => handleEdit(driver)}
                      startIcon={<EditIcon />}
                      color="warning"
                      variant="outlined"
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleViewCars(driver)}
                      startIcon={<CarIcon />}
                      color="info"
                      variant="outlined"
                      size="small"
                    >
                      View Cars
                    </Button>
                    <Box position="relative">
                      <Button
                        onClick={() => handleMessage(driver)}
                        startIcon={<MessageIcon />}
                        color="primary"
                        variant="outlined"
                        size="small"
                      >
                        Message
                      </Button>
                      {driverUnreadCounts[driver.id] > 0 && (
                        <Badge
                          badgeContent={driverUnreadCounts[driver.id]}
                          color="error"
                          sx={{ position: 'absolute', top: -8, right: -8 }}
                        />
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Messaging Modal */}
      <DriverMessagingModal
        isOpen={showMessaging}
        onClose={handleMessagingClose}
        driverId={messagingDriverId}
        driverName={messagingDriverName}
        onNavigateToRideHistory={onNavigateToRideHistory}
      />
    </Box>
  );
};

export default DriverManager;