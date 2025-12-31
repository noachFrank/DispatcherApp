import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/adminService';
import { userAPI } from '../services/apiService';
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
  Email as EmailIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { formatDate } from '../utils/dateHelpers';
import { useAlert, } from '../contexts/AlertContext';


const DispatcherManager = () => {
  const [dispatchers, setDispatchers] = useState([]);
  const [filteredDispatchers, setFilteredDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState(null);
  const [fireConfirmOpen, setFireConfirmOpen] = useState(false);
  const [dispatcherToFire, setDispatcherToFire] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert, showToast } = useAlert();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    isAdmin: false,
    DateJoined: new Date().toISOString().split('T')[0],
    userName: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const phoneInputRef = useRef(null);

  // Phone number formatting - only formats for display
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

  // Extract digits only from formatted phone number
  const extractPhoneDigits = (value) => {
    return value.replace(/\D/g, '');
  };

  // Handle backspace on phone number formatting characters
  const handlePhoneBackspace = (e, fieldName) => {
    if (e.key === 'Backspace') {
      const input = e.target;
      const cursorPos = input.selectionStart;
      const value = input.value;
      const charBefore = value[cursorPos - 1];

      // If cursor is right after a formatting character, remove the digit before it
      if (cursorPos > 0 && (charBefore === '(' || charBefore === ')' || charBefore === ' ' || charBefore === '-')) {
        e.preventDefault();

        let removeCount;
        if (charBefore === ' ') {
          // Space after ): remove space, ), and digit (3 chars total if available)
          removeCount = Math.min(cursorPos, 3);
        } else if (charBefore === '(') {
          // Opening paren: remove ( and digit before it (or just ( if at start)
          removeCount = cursorPos >= 2 ? 2 : 1;
        } else {
          // ) or -: remove formatting char and digit before it
          removeCount = cursorPos >= 2 ? 2 : 1;
        }

        const newValue = value.slice(0, cursorPos - removeCount) + value.slice(cursorPos);
        handleInputChange(fieldName, newValue);
      }
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

    // For phone number, extract digits then format
    if (field === 'phoneNumber') {
      const digits = extractPhoneDigits(value);
      processedValue = formatPhoneNumber(digits);
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

  const handleResetPassword = async () => {
    if (!editingDispatcher) return;

    await showAlert(
      'Reset Password',
      `Are you sure you want to reset the password for ${editingDispatcher.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Reset Password',
          onPress: async () => {
            try {
              await userAPI.forgotPassword(editingDispatcher.id);
              await showToast('A new password has been set to the dispatcher.', 'success');
            } catch (error) {
              console.error('Error resetting password:', error);
              showAlert('Error', 'Failed to reset password', [{ text: 'OK' }], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (editingDispatcher) {
        await adminAPI.dispatchers.update(formData);
      } else {
        // Include empty password - server will generate the actual password
        const response = await adminAPI.dispatchers.create({ ...formData, password: '' });

        // Check if there was a warning (email failed to send)
        if (response && response.warning) {
          showAlert('Error sending email', `Warning: ${response.warning}\n\nTemporary Password: ${response.tempPassword}`
            , [{ text: 'OK' }], 'error');
        }
      }

      // Reload dispatchers and reset form
      await loadDispatchers();
      resetForm();

    } catch (error) {
      console.error('Failed to save dispatcher:', error);
      showAlert('Failed to save dispatcher', 'Failed to save dispatcher. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dispatcher) => {
    setEditingDispatcher(dispatcher);
    setFormData({
      id: dispatcher.id,
      name: dispatcher.name,
      email: dispatcher.email,
      phoneNumber: dispatcher.phoneNumber,
      isActive: dispatcher.isActive ?? true,
      isAdmin: dispatcher.isAdmin ?? false
    });
    setShowAddForm(true);
  };

  const handleFireClick = (dispatcher) => {
    setDispatcherToFire(dispatcher);
    setFireConfirmOpen(true);
  };

  const handleFireConfirm = async () => {
    try {
      console.log('Firing dispatcher with ID:', dispatcherToFire.id);
      await adminAPI.dispatchers.fire(dispatcherToFire.id);
      showToast('Dispatcher fired successfully.', 'success');
      setFireConfirmOpen(false);
      setDispatcherToFire(null);
      // Refresh the list
      loadDispatchers();
    } catch (error) {
      console.error('Error firing dispatcher:', error);
      showAlert('Error', 'Failed to fire dispatcher. Please try again.', [{ text: 'OK' }], 'error');
    }
  };

  const handleFireCancel = () => {
    setFireConfirmOpen(false);
    setDispatcherToFire(null);
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
              onKeyDown={(e) => handlePhoneBackspace(e, 'phoneNumber')}
              error={!!validationErrors.phoneNumber}
              helperText={validationErrors.phoneNumber}
              placeholder="(555) 123-4567"
              inputRef={phoneInputRef}
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
          {editingDispatcher && (
            <Button
              onClick={handleResetPassword}
              color="warning"
              disabled={submitting}
              sx={{ mr: 'auto' }}
            >
              Reset Password
            </Button>
          )}
          <Button onClick={resetForm} color="secondary" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : (editingDispatcher ? 'Update' : 'Create')}
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
                        {dispatcher.isActive && <Chip label="Active" color="success" size="small" sx={{ mr: 1 }} />}
                        {dispatcher.isAdmin && <Chip label="Admin" color="primary" size="small" />}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        onClick={() => handleEdit(dispatcher)}
                        startIcon={<EditIcon />}
                        color="warning"
                        variant="contained"
                        size="small"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleFireClick(dispatcher)}
                        startIcon={<PersonOffIcon />}
                        color="error"
                        variant="contained"
                        size="small"
                      >
                        Fire
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Fire Confirmation Dialog */}
      <Dialog open={fireConfirmOpen} onClose={handleFireCancel}>
        <DialogTitle>Confirm Fire Dispatcher</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to fire <strong>{dispatcherToFire?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will set their end date and prevent them from logging in. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFireCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleFireConfirm} color="error" variant="contained">
            Fire Dispatcher
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DispatcherManager;