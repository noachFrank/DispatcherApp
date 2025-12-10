import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Grid,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import signalRService from '../services/signalRService';
import { creditCardStorage } from '../utils/creditCardStorage';
import { driversAPI } from '../services/apiService';
import AddressAutocomplete from './AddressAutocomplete';
import { calculateRoute } from '../services/routeCalculator';
import { useGoogleMaps } from './GoogleMapsProvider';

// Car type options matching the C# CarType enum
const CAR_TYPES = [
  { value: 0, label: 'Car' },
  { value: 1, label: 'SUV' },
  { value: 2, label: 'MiniVan' },
  { value: 3, label: '12 Passenger' },
  { value: 4, label: '15 Passenger' },
  { value: 5, label: 'Luxury SUV' }
];


const NewCallWizard = ({ onComplete, onCancel }) => {
  const { user, signalRConnection } = useAuth();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    // Ride object fields
    customerName: '',
    customerPhoneNumber: '',
    cost: 0,
    notes: '',
    paymentType: 'cash',
    passengers: 1,
    carType: 0,
    assignedToId: null,
    assignedToName: '',

    // Route object fields
    pickup: '',
    dropOff: '',
    additionalStops: [],
    roundTrip: false,
    estimatedDuration: 0, // in minutes

    // Credit card info (for payment processing)
    ccNumber: '',
    expiryDate: '',
    cvv: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  // Track if addresses were selected from autocomplete (not just typed)
  const [addressesValidated, setAddressesValidated] = useState({ pickup: false, dropOff: false });
  // Track which stop indices have been validated (selected from autocomplete)
  const [stopsValidated, setStopsValidated] = useState([]);
  const scheduleRef = useRef(null);

  // Fetch all drivers on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await driversAPI.getAll();
        setDrivers(data || []);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };
    fetchDrivers();
  }, []);

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

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Format phone number as user types
    if (field === 'customerPhoneNumber') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // If user is typing in address fields, mark as not validated
    // (they need to select from autocomplete to validate)
    if (field === 'dropOff' || field === 'pickup') {
      setAddressesValidated(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // Calculate route when pickup, dropoff, stops, or roundTrip changes
  const calculateTripRoute = async () => {
    // Only calculate if both addresses were selected from autocomplete
    if (!googleMapsLoaded || !formData.pickup || !formData.dropOff) {
      setRouteInfo({ distance: '', duration: '' });
      setFormData(prev => ({ ...prev, estimatedDuration: 0, cost: 0 }));
      return;
    }

    // Only calculate if both addresses are validated (selected from autocomplete)
    if (!addressesValidated.pickup || !addressesValidated.dropOff) {
      return;
    }

    setIsCalculatingRoute(true);
    try {
      // Only include stops that have been validated (selected from autocomplete)
      const validatedStops = formData.additionalStops.filter((s, index) =>
        s && s.trim() !== '' && stopsValidated.includes(index)
      );

      const result = await calculateRoute(
        formData.pickup,
        formData.dropOff,
        validatedStops,
        formData.roundTrip
      );

      if (result.error) {
        // Silently handle errors - don't log to console for expected cases
        setRouteInfo({ distance: '', duration: '' });
      } else {
        setRouteInfo({
          distance: result.distanceText,
          duration: result.durationText
        });

        // Update estimated duration and calculate cost based on distance
        const estimatedCost = Math.round(result.distance * 2.5); // $2.50 per mile
        setFormData(prev => ({
          ...prev,
          estimatedDuration: result.duration,
          cost: Math.max(10, estimatedCost) // Minimum $10
        }));
      }
    } catch (error) {
      // Silently handle errors
      setRouteInfo({ distance: '', duration: '' });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Trigger route calculation when addresses change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.pickup && formData.dropOff && addressesValidated.pickup && addressesValidated.dropOff) {
        calculateTripRoute();
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [formData.pickup, formData.dropOff, formData.additionalStops, formData.roundTrip, googleMapsLoaded, addressesValidated, stopsValidated]);

  // Handle address selection from autocomplete
  const handleAddressSelect = (field, address, placeDetails) => {
    setFormData(prev => ({
      ...prev,
      [field]: address
    }));

    // Mark this address as validated (selected from autocomplete)
    setAddressesValidated(prev => ({
      ...prev,
      [field]: true
    }));

    // Clear error when address is selected
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle stop address selection
  const handleStopSelect = (index, address, placeDetails) => {
    const newStops = [...formData.additionalStops];
    newStops[index] = address;
    setFormData(prev => ({
      ...prev,
      additionalStops: newStops
    }));

    // Mark this stop as validated
    setStopsValidated(prev => {
      if (!prev.includes(index)) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const setPrice = () => {
    // Placeholder logic for setting price based on pickup/drop-off
    // In a real implementation, you would calculate distance and set price accordingly
    if (!formData.pickup || !formData.dropOff) {
      setFormData(prev => ({
        ...prev,
        ['cost']: 0
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      ['cost']: 10
    }));

  };

  const addStop = () => {
    const newStops = [...formData.additionalStops, ''];
    setFormData(prev => ({
      ...prev,
      additionalStops: newStops
    }));
  };

  const removeStop = (index) => {
    const newStops = formData.additionalStops.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      additionalStops: newStops
    }));

    // Adjust stopsValidated: remove this index and decrement indices above it
    setStopsValidated(prev =>
      prev
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i)
    );
  };

  const updateStop = (index, value) => {
    const newStops = [...formData.additionalStops];
    newStops[index] = value;
    setFormData(prev => ({
      ...prev,
      additionalStops: newStops
    }));

    // When manually typed, invalidate this stop
    setStopsValidated(prev => prev.filter(i => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    //console.log(formData.customerPhoneNumber);
    if (!formData.customerPhoneNumber.trim()) {
      newErrors.customerPhoneNumber = 'Phone number is required';
    } else {
      // Validate phone format
      const phoneDigits = formData.customerPhoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.customerPhoneNumber = 'Phone number must be 10 digits';
      }
    }

    if (!formData.pickup.trim()) {
      newErrors.pickup = 'Pickup location is required';
    }

    if (!formData.dropOff.trim()) {
      newErrors.dropOff = 'Drop-off location is required';
    }

    // Validate passengers (required, must be at least 1)
    if (!formData.passengers || formData.passengers < 1) {
      newErrors.passengers = 'At least 1 passenger is required';
    }

    if (formData.paymentType === 'dispatcherCC') {
      if (!formData.ccNumber.trim()) {
        newErrors.ccNumber = 'Credit card number is required';
      }
      if (!formData.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      }
      if (!formData.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      }
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required';
      }
    }

    setErrors(newErrors);
    //console.log("validating form...", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildNewRideObject = () => {
    const now = new Date();
    const currentTime = now.toISOString();
    let scheduledFor = currentTime;
    if (scheduledDate && scheduledTime) {
      const localScheduledDate = new Date(`${scheduledDate}T${scheduledTime}`);
      scheduledFor = localScheduledDate.toISOString();
    }

    // Convert estimatedDuration (minutes) to TimeOnly format (HH:mm:ss)
    const durationMinutes = formData.estimatedDuration || 0;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = Math.floor(durationMinutes % 60);
    const estimatedDurationTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Build a Ride object that matches the C# Ride class structure
    const rideObject = {
      rideId: 0,
      routeId: 0,
      customerName: formData.customerName,
      customerPhoneNumber: formData.customerPhoneNumber.replace(/\D/g, ''),
      callTime: currentTime,
      scheduledFor: scheduledFor,
      pickupTime: null,
      dropOffTime: null,
      cost: parseInt(formData.cost) || 0,
      driversCompensation: formData.cost > 0 ? Math.round((parseInt(formData.cost)) * 0.6) : 0,
      paidTime: null,
      assignedToId: formData.assignedToId || null,
      reassignedToId: null,
      notes: formData.notes || "",
      dispatchedById: user?.userId || null,
      paymentType: formData.paymentType,
      reassigned: false,
      canceled: false,
      passengers: parseInt(formData.passengers) || 1,
      carType: parseInt(formData.carType) || 0,
      estimatedDuration: estimatedDurationTime,
      route: {
        routeId: 0,
        pickup: formData.pickup,
        dropOff: formData.dropOff,
        stop1: formData.additionalStops[0] || null,
        stop2: formData.additionalStops[1] || null,
        stop3: formData.additionalStops[2] || null,
        stop4: formData.additionalStops[3] || null,
        stop5: formData.additionalStops[4] || null,
        stop6: formData.additionalStops[5] || null,
        stop7: formData.additionalStops[6] || null,
        stop8: formData.additionalStops[7] || null,
        stop9: formData.additionalStops[8] || null,
        stop10: formData.additionalStops[9] || null,
        roundTrip: formData.roundTrip,
        callTime: currentTime
      }
    };

    return rideObject;
  };

  const handleCreditCardStorage = (formData) => {
    if (formData.paymentType === 'dispatcherCC') {
      const ccDetails = {
        ccNumber: formData.ccNumber,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        zipCode: formData.zipCode
      };
      return creditCardStorage.save(ccDetails);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Handle credit card storage if CC payment
      const ccStorageKey = handleCreditCardStorage(formData);
      if (ccStorageKey) {
        console.log('Credit card details saved locally with key:', ccStorageKey);
      }

      const newRideData = buildNewRideObject();

      try {
        if (signalRConnection) {
          console.log('Broadcasting new call via SignalR...');
          await signalRConnection.invoke("NewCallCreated", newRideData);
        } else {
          console.warn('SignalR not connected, call created but not broadcasted in real-time');
        }
      } catch (signalError) {
        console.error('Failed to broadcast call via SignalR:', signalError);
      }

      onComplete(newRideData);

      clearForm();

      alert('Call sent!');
    } catch (error) {
      console.error('Failed to create ride:', error);
      alert('Failed to create ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleClick = () => {
    if (!validateForm()) return;
    setShowDatePicker(true);
    // Scroll to schedule section after it renders
    setTimeout(() => {
      scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time for scheduling');
      return;
    }
    await handleSubmit();
    // Clear schedule fields and hide the schedule section
    setScheduledDate('');
    setScheduledTime('');
    setShowDatePicker(false);
  };

  const clearForm = () => {
    setFormData({
      customerName: '',
      customerName: '',
      customerPhoneNumber: '',
      cost: 0,
      notes: '',
      paymentType: 'cash',
      passengers: 1,
      carType: 0,
      assignedToId: null,
      assignedToName: '',
      pickup: '',
      dropOff: '',
      roundTrip: false,
      additionalStops: [],
      notes: '',
      paymentType: 'cash',
      ccNumber: '',
      expiryDate: '',
      cvv: '',
      zipCode: ''
    });
    setErrors({});
    // Reset trip estimate and validation states
    setRouteInfo({ distance: '', duration: '' });
    setAddressesValidated({ pickup: false, dropOff: false });
    setStopsValidated([]);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">New Call Request</Typography>
          <IconButton onClick={onCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Left Side - Call Details */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Call Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      error={!!errors.customerName}
                      helperText={errors.customerName}
                      placeholder="Enter customer name (optional)"
                      margin="normal"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Number"
                      type="tel"
                      value={formData.customerPhoneNumber}
                      onChange={(e) => handleInputChange('customerPhoneNumber', e.target.value)}
                      error={!!errors.customerPhoneNumber}
                      helperText={errors.customerPhoneNumber}
                      placeholder="(555) 123-4567"
                      inputProps={{ maxLength: 14 }}
                      margin="normal"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <AddressAutocomplete
                      label="Pickup Location"
                      value={formData.pickup}
                      onChange={(address, placeDetails) => handleAddressSelect('pickup', address, placeDetails)}
                      onInputChange={(value) => handleInputChange('pickup', value)}
                      error={!!errors.pickup}
                      helperText={errors.pickup}
                      placeholder="Enter pickup address"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <AddressAutocomplete
                      label="Drop-off Location"
                      value={formData.dropOff}
                      onChange={(address, placeDetails) => handleAddressSelect('dropOff', address, placeDetails)}
                      onInputChange={(value) => handleInputChange('dropOff', value)}
                      error={!!errors.dropOff}
                      helperText={errors.dropOff}
                      placeholder="Enter drop-off address"
                      required
                    />
                  </Grid>

                  {/* Passengers */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Passengers"
                      type="number"
                      value={formData.passengers}
                      onChange={(e) => handleInputChange('passengers', parseInt(e.target.value) || 1)}
                      error={!!errors.passengers}
                      helperText={errors.passengers}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                      margin="normal"
                      required
                    />
                  </Grid>

                  {/* Car Type */}
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel shrink>Car Type</InputLabel>
                      <Select
                        value={formData.carType}
                        label="Car Type"
                        displayEmpty
                        notched
                        onChange={(e) => handleInputChange('carType', e.target.value)}
                      >
                        {CAR_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Assigned To Driver */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={drivers}
                      getOptionLabel={(option) => option.name || ''}
                      value={drivers.find(d => d.id === formData.assignedToId) || null}
                      onChange={(e, newValue) => {
                        handleInputChange('assignedToId', newValue?.id || null);
                        handleInputChange('assignedToName', newValue?.name || '');
                      }}
                      sx={{ minWidth: 200 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Assign to Driver"
                          placeholder="Search drivers..."
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiInputBase-root': { minWidth: 180 } }}
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.roundTrip}
                          onChange={(e) => handleInputChange('roundTrip', e.target.checked)}
                        />
                      }
                      label="Round Trip"
                    />
                  </Grid>
                </Grid>

                {/* Additional Stops */}
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Additional Stops</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addStop}
                      variant="outlined"
                    >
                      Add Stop
                    </Button>
                  </Box>

                  {Array.isArray(formData.additionalStops) && formData.additionalStops.map((stop, index) => (
                    <Box key={index} display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <Box sx={{ flex: 1 }}>
                        <AddressAutocomplete
                          label={`Stop ${index + 1}`}
                          value={stop}
                          onChange={(address, placeDetails) => handleStopSelect(index, address, placeDetails)}
                          onInputChange={(value) => updateStop(index, value)}
                          placeholder={`Stop ${index + 1} address`}
                          size="small"
                          margin="none"
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeStop(index)}
                        color="error"
                        sx={{ mt: 1 }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* Route Info and Cost Row */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Route Info */}
                  {(routeInfo.distance || routeInfo.duration || isCalculatingRoute) && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Trip Estimate
                      </Typography>
                      {isCalculatingRoute ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Calculating...
                          </Typography>
                        </Box>
                      ) : (
                        <Box display="flex" gap={1}>
                          {routeInfo.distance && (
                            <Chip
                              label={routeInfo.distance}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          )}
                          {routeInfo.duration && (
                            <Chip
                              label={routeInfo.duration}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Estimated Cost
                    </Typography>
                    <Chip
                      label={`$${formData.cost.toFixed(2)}`}
                      color="primary"
                      variant="outlined"
                      size="large"
                    />
                  </Box>

                  {/* Notes */}
                  <TextField
                    sx={{ flex: 1, minWidth: 200 }}
                    label="Notes"
                    multiline
                    rows={2}
                    size="small"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side - Payment Info */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>

                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <FormLabel component="legend">Payment Method</FormLabel>
                  <RadioGroup
                    row
                    value={formData.paymentType}
                    onChange={(e) => handleInputChange('paymentType', e.target.value)}
                    sx={{ mt: 1 }}
                  >
                    <FormControlLabel
                      value="cash"
                      control={<Radio />}
                      label="Cash"
                    />
                    <FormControlLabel
                      value="check"
                      control={<Radio />}
                      label="Check"
                    />
                    <FormControlLabel
                      value="driverCC"
                      control={<Radio />}
                      label="Driver CC"
                    />
                    <FormControlLabel
                      value="dispatcherCC"
                      control={<Radio />}
                      label="Dispatcher CC"
                    />
                  </RadioGroup>
                </FormControl>

                {/* Credit Card Fields - Only show for Dispatcher CC */}
                {formData.paymentType === 'dispatcherCC' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Credit Card Information
                    </Typography>

                    <TextField
                      fullWidth
                      label="Card Number *"
                      value={formData.ccNumber}
                      onChange={(e) => handleInputChange('ccNumber', e.target.value)}
                      error={!!errors.ccNumber}
                      helperText={errors.ccNumber}
                      placeholder="1234 5678 9012 3456"
                      margin="normal"
                      required
                    />

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Expiry Date *"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          error={!!errors.expiryDate}
                          helperText={errors.expiryDate}
                          placeholder="MM/YY"
                          required
                        />
                      </Grid>

                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="CVV *"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          error={!!errors.cvv}
                          helperText={errors.cvv}
                          placeholder="123"
                          required
                        />
                      </Grid>

                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Zip Code *"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          error={!!errors.zipCode}
                          helperText={errors.zipCode}
                          placeholder="12345"
                          required
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Schedule Date/Time Picker */}
        {showDatePicker && (
          <Card ref={scheduleRef} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schedule Call
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: getTomorrowDate() }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowDatePicker(false)}
                  color="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleSubmit}
                  disabled={isSubmitting}
                  variant="contained"
                  color="primary"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      {/* Bottom Actions */}
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleScheduleClick}
          disabled={isSubmitting || showDatePicker}
          startIcon={<ScheduleIcon />}
          color="secondary"
          variant="outlined"
        >
          Schedule Call
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || showDatePicker}
          startIcon={<SendIcon />}
          variant="contained"
          color="primary"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCallWizard;