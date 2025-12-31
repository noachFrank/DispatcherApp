import React, { useState, useEffect, useRef } from 'react';
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
  Email as EmailIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/adminService';
import { messagesAPI, userAPI } from '../services/apiService';
import { useAlert } from '../contexts/AlertContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CarManager from './CarManager';
import DriverMessagingModal from './DriverMessagingModal';
import { formatDate } from '../utils/dateHelpers';

const DriverManager = ({ onNavigateToRideHistory, openMessagingModal, openMessagingDriverId, onMessagingModalClose, onMarkMessagesRead }) => {
  const { showAlert, showToast } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [fireConfirmOpen, setFireConfirmOpen] = useState(false);
  const [driverToFire, setDriverToFire] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    license: '',
    userName: ''
  });

  // Validation state
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
      const data = await adminAPI.drivers.getActive();

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
      // Fetch unread messages from drivers
      const unreadMessages = await messagesAPI.getUnread();
      const messagesArray = unreadMessages || [];

      // Count unread messages per driver
      const counts = {};
      messagesArray.forEach((msg) => {
        counts[msg.driverId] = (counts[msg.driverId] || 0) + 1;
      });

      setDriverUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to load unread counts:', error);
      setDriverUnreadCounts({});
    }
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // For phone number, extract digits then format
    if (field === 'phoneNumber') {
      const input = phoneInputRef.current;
      const cursorPos = input?.selectionStart || 0;
      const oldValue = formData.phoneNumber || '';

      const oldDigits = extractPhoneDigits(oldValue);
      const newDigits = extractPhoneDigits(value);

      processedValue = formatPhoneNumber(newDigits);

      // Maintain cursor position after delete
      if (newDigits.length < oldDigits.length) {
        setTimeout(() => {
          if (input) {
            let newPos = cursorPos;
            if (processedValue[cursorPos - 1] === ')' ||
              processedValue[cursorPos - 1] === ' ' ||
              processedValue[cursorPos - 1] === '-') {
              newPos = cursorPos - 1;
            }
            input.setSelectionRange(newPos, newPos);
          }
        }, 0);
      }
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
    if (!editingDriver) return;

    await showAlert(
      'Reset Password',
      `Are you sure you want to reset the password for ${editingDriver.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Reset Password',
          onPress: async () => {
            try {
              await userAPI.forgotPassword(editingDriver.id, 'driver');
              await showToast('A new password has been set to the driver.', 'success');
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
      if (editingDriver) {
        await adminAPI.drivers.update(formData);
      } else {
        // Include empty password - server will generate the actual password
        const response = await adminAPI.drivers.create({ ...formData, password: '' });

        // Check if there was a warning (email failed to send)
        if (response && response.warning) {
          showAlert('Error sending email', `Warning: ${response.warning}\n\nTemporary Password: ${response.tempPassword}`
            , [{ text: 'OK' }], 'warning');
        }
      }

      // Reload drivers and reset form
      await loadDrivers();
      resetForm();

    } catch (error) {
      console.error('Failed to save driver:', error);
      showAlert('Error', 'Failed to save driver. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      id: driver.id,
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
    // Mark messages from this driver as read
    if (onMarkMessagesRead) {
      onMarkMessagesRead(driver.id);
    }

    // Use openMessagingModal if provided (URL-based approach)
    if (openMessagingModal) {
      openMessagingModal(driver.id);
    } else {
      // Fallback to old approach
      setMessagingDriverId(driver.id);
      setMessagingDriverName(driver.name);
      setShowMessaging(true);
    }
  };

  const handleFireClick = (driver) => {
    setDriverToFire(driver);
    setFireConfirmOpen(true);
  };

  const handleFireConfirm = async () => {
    try {
      const result = await adminAPI.drivers.fire(driverToFire.id);
      setFireConfirmOpen(false);
      setDriverToFire(null);

      // Show success message with affected calls count
      if (result && result.affectedCalls > 0) {
        showToast(`Driver fired successfully. ${result.affectedCalls} active call(s) have been reassigned.`, 'success');
      } else {
        showToast('Driver fired successfully.', 'success');
      }

      // Refresh the list
      loadDrivers();
    } catch (error) {
      console.error('Error firing driver:', error);
      showAlert('Failed to fire driver', 'Failed to fire driver. Please try again.', [{ text: 'OK' }], 'error');
    }
  };

  const handleFireCancel = () => {
    setFireConfirmOpen(false);
    setDriverToFire(null);
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

    // Notify parent that modal is closed (for URL-based modal)
    if (onMessagingModalClose) {
      onMessagingModalClose();
    }
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
              onKeyDown={(e) => handlePhoneBackspace(e, 'phoneNumber')}
              error={!!validationErrors.phoneNumber}
              helperText={validationErrors.phoneNumber}
              placeholder="(555) 123-4567"
              inputRef={phoneInputRef}
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
          {editingDriver && (
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
            {submitting ? <CircularProgress size={20} /> : (editingDriver ? 'Update' : 'Create')}
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
                      <strong>Joined:</strong> {formatDate(driver.joinedDate)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        onClick={() => handleEdit(driver)}
                        startIcon={<EditIcon />}
                        color="warning"
                        variant="contained"
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>

                      <Badge
                        badgeContent={driverUnreadCounts[driver.id] || 0}
                        color="error"
                        invisible={!driverUnreadCounts[driver.id] || driverUnreadCounts[driver.id] === 0}
                        sx={{ flex: 1 }}
                      >
                        <Button
                          onClick={() => handleMessage(driver)}
                          startIcon={<MessageIcon />}
                          color="success"
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          Message
                        </Button>
                      </Badge>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        onClick={() => handleFireClick(driver)}
                        startIcon={<PersonOffIcon />}
                        color="error"
                        variant="contained"
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        Fire
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
        isOpen={showMessaging || !!openMessagingDriverId}
        onClose={handleMessagingClose}
        driverId={openMessagingDriverId || messagingDriverId}
        driverName={messagingDriverName}
        onNavigateToRideHistory={onNavigateToRideHistory}
      />

      {/* Fire Confirmation Dialog */}
      <Dialog open={fireConfirmOpen} onClose={handleFireCancel}>
        <DialogTitle>Confirm Fire Driver</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to fire <strong>{driverToFire?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Set their end date and prevent them from logging in
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Reassign all their active calls to other drivers
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Notify other drivers about newly available calls
            </Typography>
          </Box>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFireCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleFireConfirm} color="error" variant="contained">
            Fire Driver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverManager;