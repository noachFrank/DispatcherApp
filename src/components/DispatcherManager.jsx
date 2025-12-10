import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminService';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const DispatcherManager = () => {
  const [dispatchers, setDispatchers] = useState([]);
  const [filteredDispatchers, setFilteredDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    isAdmin: false,
    DateJoined: new Date().toISOString().split('T')[0],
    userName: '',
  });

  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      // If it's a string, try to parse it
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return dateValue; // Return original if can't parse
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateValue || 'N/A';
    }
  };

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    loadDispatchers();
  }, []);

  useEffect(() => {
    const dispatchersArray = Array.isArray(dispatchers) ? dispatchers : [];

    if (searchTerm) {
      const filtered = dispatchersArray.filter(dispatcher =>
        (dispatcher.name && dispatcher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dispatcher.email && dispatcher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dispatcher.phoneNumber && dispatcher.phoneNumber.includes(searchTerm))
      );
      setFilteredDispatchers(filtered);
    } else {
      setFilteredDispatchers(dispatchersArray);
    }
  }, [searchTerm, dispatchers]);

  const loadDispatchers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.dispatchers.getActive();

      // Ensure data is always an array
      const dispatchersArray = Array.isArray(data) ? data : [];

      setDispatchers(dispatchersArray);
      setFilteredDispatchers(dispatchersArray);
    } catch (error) {
      console.error('Failed to load dispatchers:', error);
      // Set empty arrays on error
      setDispatchers([]);
      setFilteredDispatchers([]);
    } finally {
      setLoading(false);
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
      if (editingDispatcher) {
        await adminAPI.dispatchers.update(formData);
      } else {
        // Include empty password - server will generate the actual password
        const response = await adminAPI.dispatchers.create({ ...formData, password: '' });

        // Check if there was a warning (email failed to send)
        if (response && response.warning) {
          alert(`Warning: ${response.warning}\n\nTemporary Password: ${response.tempPassword}`);
        }
      }

      // Reload dispatchers and reset form
      await loadDispatchers();
      resetForm();

    } catch (error) {
      console.error('Failed to save dispatcher:', error);
      alert('Failed to save dispatcher. Please try again.');
    }
  };

  const handleEdit = (dispatcher) => {
    setEditingDispatcher(dispatcher);
    setFormData({
      name: dispatcher.name,
      email: dispatcher.email,
      phoneNumber: dispatcher.phoneNumber,
      isActive: dispatcher.isActive ?? true,
      isAdmin: dispatcher.isAdmin ?? false
    });
    setShowAddForm(true);
  };


  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      isActive: true,
      isAdmin: false
    });
    setValidationErrors({});
    setEditingDispatcher(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dispatchers...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search dispatchers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: '300px', flexGrow: 1 }}
        />
        <Button
          onClick={() => setShowAddForm(true)}
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add Dispatcher
        </Button>
      </Box>

      <Dialog open={showAddForm} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingDispatcher ? 'Edit Dispatcher' : 'Add New Dispatcher'}
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
            <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAdmin}
                    onChange={(e) => handleInputChange('isAdmin', e.target.checked)}
                  />
                }
                label="Admin"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingDispatcher ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3 }}>
        {!Array.isArray(filteredDispatchers) || filteredDispatchers.length === 0 ? (
          <Box textAlign="center" py={5}>
            <Typography variant="h6" color="text.secondary">
              No dispatchers found.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredDispatchers.map(dispatcher => {
              return (
                <Grid item xs={12} sm={6} lg={4} key={dispatcher.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h4" gutterBottom>
                        {dispatcher.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Email:</strong> {dispatcher.email}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Phone:</strong> {dispatcher.phoneNumber}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Joined:</strong> {formatDate(dispatcher.dateJoined || dispatcher.DateJoined)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {dispatcher.isAdmin && <Chip label="Admin" color="error" size="small" sx={{ mr: 1 }} />}
                        {dispatcher.isActive && <Chip label="Active" color="primary" size="small" />}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        onClick={() => handleEdit(dispatcher)}
                        startIcon={<EditIcon />}
                        color="warning"
                        variant="outlined"
                        size="small"
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default DispatcherManager;