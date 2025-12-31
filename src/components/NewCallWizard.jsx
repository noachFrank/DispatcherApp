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
  Send as SendIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import signalRService from '../services/signalRService';
import { creditCardStorage } from '../utils/creditCardStorage';
import { driversAPI, ridesAPI } from '../services/apiService';
import AddressAutocomplete from './AddressAutocomplete';
import SquarePaymentForm from './SquarePaymentForm';
import { calculateRoute } from '../services/routeCalculator';
import { useGoogleMaps } from './GoogleMapsProvider';
import soundService from '../services/soundService';

// Car type options matching the C# CarType enum
const CAR_TYPES = [
  { value: 0, label: 'Car' },
  { value: 1, label: 'SUV' },
  { value: 2, label: 'MiniVan' },
  { value: 3, label: '12 Passenger' },
  { value: 4, label: '15 Passenger' },
  { value: 5, label: 'Luxury SUV' },
  { value: 6, label: 'Mercedes Sprinter' }

];


const NewCallWizard = ({ onComplete, onCancel }) => {
  const { user, signalRConnection } = useAuth();
  const { showAlert, showToast } = useAlert();
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    // Ride object fields
    customerName: '',
    customerPhoneNumber: '',
    cost: 0,
    driversCompensation: 0,
    notes: '',
    paymentType: 'cash',
    passengers: 1,
    carType: 0,
    carSeat: false,
    assignedToId: null,
    assignedToName: '',
    flightNumber: '',

    // Route object fields
    pickup: '',
    dropOff: '',
    additionalStops: [],
    roundTrip: false,
    estimatedDuration: 0, // in minutes

    // Payment token (Square tokenization)
    paymentTokenId: null
  });

  const [errors, setErrors] = useState({});
  const phoneInputRef = useRef(null);
  const stopRefs = useRef([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  const [pricingDetails, setPricingDetails] = useState(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
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

  // Check if an address is an airport (JFK, LGA, EWR)
  const isAirport = (address) => {
    if (!address) return false;
    const addr = address.toLowerCase();
    return addr.includes('jfk') ||
      addr.includes('john f. kennedy') ||
      addr.includes('kennedy airport') ||
      addr.includes('lga') ||
      addr.includes('laguardia') ||
      addr.includes('ewr') ||
      addr.includes('newark airport') ||
      addr.includes('newark liberty') ||
      /\b11430\b/.test(address) || // JFK zip
      /\b11371\b/.test(address) || // LGA zip
      /\b07114\b/.test(address);   // EWR zip
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

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // For phone number, extract digits then format
    if (field === 'customerPhoneNumber') {
      // Get current cursor position before formatting
      const input = phoneInputRef.current;
      const cursorPos = input?.selectionStart || 0;
      const oldValue = formData.customerPhoneNumber || '';

      // Extract digits from both old and new values
      const oldDigits = extractPhoneDigits(oldValue);
      const newDigits = extractPhoneDigits(value);

      // Format the new value
      processedValue = formatPhoneNumber(newDigits);

      // Calculate new cursor position after formatting
      // If digits were removed (backspace), keep cursor at same position
      if (newDigits.length < oldDigits.length) {
        // User deleted a digit - maintain cursor position
        setTimeout(() => {
          if (input) {
            // Find the position in the new formatted string
            let newPos = cursorPos;
            // If cursor was after a formatting char that got removed, adjust
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
      setFormData(prev => ({ ...prev, estimatedDuration: 0, cost: 0, driversCompensation: 0 }));
      setPricingDetails(null);
      return;
    }

    // Only calculate if both addresses are validated (selected from autocomplete)
    if (!addressesValidated.pickup || !addressesValidated.dropOff) {
      return;
    }

    setIsCalculatingRoute(true);
    setIsCalculatingPrice(true);
    try {
      // Only include stops that have been validated (selected from autocomplete)
      const validatedStops = formData.additionalStops.filter((s, index) =>
        s && s.trim() !== '' && stopsValidated.includes(index)
      );

      // Calculate route for distance/duration display
      const result = await calculateRoute(
        formData.pickup,
        formData.dropOff,
        validatedStops,
        formData.roundTrip
      );

      if (result.error) {
        setRouteInfo({ distance: '', duration: '' });
      } else {
        setRouteInfo({
          distance: result.distanceText,
          duration: result.durationText
        });

        setFormData(prev => ({
          ...prev,
          estimatedDuration: result.duration
        }));
      }

      // Call pricing API for accurate pricing
      await calculatePricing(validatedStops);
    } catch (error) {
      // Silently handle errors
      setRouteInfo({ distance: '', duration: '' });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Calculate pricing using the server API
  const calculatePricing = async (validatedStops = []) => {
    try {
      // Build scheduled time for rush hour calculation
      let scheduledDateTime = null;
      if (scheduledDate && scheduledTime) {
        scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const priceRequest = {
        pickup: formData.pickup,
        dropOff: formData.dropOff,
        stops: validatedStops,
        carType: parseInt(formData.carType) || 0,
        isRoundTrip: formData.roundTrip,
        scheduledTime: scheduledDateTime
      };

      const response = await ridesAPI.calculatePrice(priceRequest);

      if (response.success) {
        setPricingDetails(response);
        // Add $10 for car seat if needed
        const carSeatSurcharge = formData.carSeat ? 10 : 0;
        setFormData(prev => ({
          ...prev,
          cost: Math.round(response.totalPrice) + carSeatSurcharge,
          driversCompensation: Math.round(response.driversCompensation)
        }));
      } else {
        console.error('Pricing calculation failed:', response.error);
        // Reset to 0 if pricing fails
        setPricingDetails(null);
        setFormData(prev => ({
          ...prev,
          cost: 0,
          driversCompensation: 0
        }));
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPricingDetails(null);
      setFormData(prev => ({
        ...prev,
        cost: 0,
        driversCompensation: 0
      }));
    } finally {
      setIsCalculatingPrice(false);
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
  }, [formData.pickup, formData.dropOff, formData.additionalStops, formData.roundTrip, formData.carType, formData.carSeat, scheduledDate, scheduledTime, googleMapsLoaded, addressesValidated, stopsValidated]);

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

  const addStop = () => {
    // Maximum 10 stops allowed (stop1 through stop10 in the database)
    console.log(formData.additionalStops.length);
    if (formData.additionalStops.length >= 10) {
      showAlert('Maximum Stops', 'Maximum 10 stops allowed', [{ text: 'OK' }], 'warning');
      return;
    }
    const newStops = [...formData.additionalStops, ''];
    setFormData(prev => ({
      ...prev,
      additionalStops: newStops
    }));

    // Focus on the newly added stop after render
    setTimeout(() => {
      const lastIndex = newStops.length - 1;
      if (stopRefs.current[lastIndex]) {
        stopRefs.current[lastIndex].focus();
      }
    }, 100);
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

  const validateForm = (skipTokenValidation = false) => {
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

    // Only validate payment token if we didn't just tokenize (to avoid race condition)
    if (formData.paymentType === 'dispatcherCC' && !skipTokenValidation) {
      if (!formData.paymentTokenId) {
        newErrors.paymentTokenId = 'Please enter credit card information';
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
      driversCompensation: parseInt(formData.driversCompensation) || 0,
      paidTime: null,
      assignedToId: formData.assignedToId || null,
      reassignedToId: null,
      notes: formData.notes || "",
      dispatchedById: user?.userId || null,
      paymentType: formData.paymentType,
      paymentTokenId: formData.paymentTokenId || null,
      reassigned: false,
      canceled: false,
      passengers: parseInt(formData.passengers) || 1,
      carSeat: formData.carSeat,
      carType: parseInt(formData.carType) || 0,
      isReoccurring: false,
      flightNumber: formData.flightNumber || null,
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
        callTime: currentTime,
        estimatedDuration: estimatedDurationTime,

      }
    };

    return rideObject;
  };

  const handlePaymentTokenGenerated = (token, cardholderName) => {
    console.log('✅ Payment token received:', token);
    setFormData(prev => ({
      ...prev,
      paymentTokenId: token
    }));
    showToast(`Card tokenized successfully for ${cardholderName}`, 'success');
  };

  const handleTokenError = (error) => {
    console.error('❌ Tokenization error:', error);
    showAlert('Error', `Failed to process card: ${error}`, [{ text: 'OK' }]);
  };

  const handleSubmit = async () => {
    // Track if we just tokenized successfully
    let justTokenized = false;
    
    // If payment type is Dispatcher CC and no token yet, try to tokenize
    if (formData.paymentType === 'dispatcherCC' && !formData.paymentTokenId) {
      if (window.squareTokenizeCard) {
        console.log('🔄 Attempting to tokenize card before submission...');
        try {
          const token = await window.squareTokenizeCard();
          if (token) {
            justTokenized = true;
            // Wait for state to update
            await new Promise(resolve => setTimeout(resolve, 700));
          }
        } catch (tokenError) {
          console.error('❌ Tokenization failed during submission:', tokenError);
          // Validation will catch the missing token and show error
        }
      } else {
        console.warn('⚠️ Square tokenization function not available');
      }
    }
    
    console.log('Submitting new call request...', formData);
    
    // Skip token validation if we just tokenized (state may not be updated yet)
    if (!validateForm(justTokenized)) return;

    setIsSubmitting(true);
    try {
      const newRideData = buildNewRideObject();
      console.log('Built ride object:', newRideData);
      try {
        if (signalRConnection) {
          console.log('Broadcasting new call via SignalR...');
          await signalRConnection.invoke("NewCallCreated", newRideData, null);
        } else {
          console.warn('SignalR not connected, call created but not broadcasted in real-time');
        }
      } catch (signalError) {
        console.error('Failed to broadcast call via SignalR:', signalError);
      }

      onComplete(newRideData);

      //clearForm();

      // Play success sound for call sent
      soundService.playCallSentSound();

      showToast('Call sent!', 'success');
    } catch (error) {
      console.error('Failed to create ride:', error);
      showAlert('Error', 'Failed to create ride. Please try again.', [{ text: 'OK' }], 'error');
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
      showAlert('Missing Information', 'Please select both date and time for scheduling', [{ text: 'OK' }], 'warning');
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
      customerPhoneNumber: '',
      cost: 0,
      driversCompensation: 0,
      notes: '',
      paymentType: 'cash',
      passengers: 1,
      carSeat: false,
      carType: 0,
      assignedToId: null,
      assignedToName: '',
      pickup: '',
      dropOff: '',
      roundTrip: false,
      additionalStops: [],
      paymentTokenId: null
    });
    setErrors({});
    // Reset trip estimate and validation states
    setRouteInfo({ distance: '', duration: '' });
    setAddressesValidated({ pickup: false, dropOff: false });
    setStopsValidated([]);
    setPricingDetails(null);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
                      onKeyDown={(e) => handlePhoneBackspace(e, 'customerPhoneNumber')}
                      error={!!errors.customerPhoneNumber}
                      helperText={errors.customerPhoneNumber}
                      placeholder="(555) 123-4567"
                      inputRef={phoneInputRef}
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

                  {/* Flight Number - only show if pickup is an airport */}
                  {isAirport(formData.pickup) && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Flight Number"
                        value={formData.flightNumber}
                        onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                        placeholder="e.g., AA123"
                        margin="normal"
                      />
                    </Grid>
                  )}

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

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2.5, gap: -0.5 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.roundTrip}
                            onChange={(e) => handleInputChange('roundTrip', e.target.checked)}
                            size="small"
                            sx={{ py: 0.25 }}
                          />
                        }
                        label={<Typography variant="caption">Round Trip</Typography>}
                        sx={{ m: 0, height: 24 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.carSeat}
                            onChange={(e) => handleInputChange('carSeat', e.target.checked)}
                            color="primary"
                            size="small"
                            sx={{ py: 0.25 }}
                          />
                        }
                        label={<Typography variant="caption">Needs Car Seat (+$10)</Typography>}
                        sx={{ m: 0, height: 24 }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Additional Stops */}
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">
                      Additional Stops {formData.additionalStops.length > 0 && `(${formData.additionalStops.length}/10)`}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addStop}
                      variant="outlined"
                      disabled={formData.additionalStops.length >= 10}
                    >
                      Add Stop
                    </Button>
                  </Box>

                  {Array.isArray(formData.additionalStops) && formData.additionalStops.map((stop, index) => (
                    <Box key={index} display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <Box sx={{ flex: 1 }}>
                        <AddressAutocomplete
                          ref={(el) => (stopRefs.current[index] = el)}
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

                  {/* Pricing Section */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Pricing
                    </Typography>
                    {isCalculatingPrice ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Calculating price...
                        </Typography>
                      </Box>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" gap={1} alignItems="center">
                          {isEditingPrice ? (
                            <>
                              <TextField
                                size="small"
                                type="number"
                                value={formData.cost}
                                onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                                label="Total"
                                InputProps={{
                                  startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>,
                                }}
                                sx={{ width: '120px' }}
                              />
                              <TextField
                                size="small"
                                type="number"
                                value={formData.driversCompensation}
                                onChange={(e) => handleInputChange('driversCompensation', parseFloat(e.target.value) || 0)}
                                label="Driver"
                                InputProps={{
                                  startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>,
                                }}
                                sx={{ width: '120px' }}
                              />
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setIsEditingPrice(false)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <Chip
                                label={`Total: $${formData.cost.toFixed(2)}`}
                                color="primary"
                                size="medium"
                              />
                              <Chip
                                label={`Driver: $${formData.driversCompensation.toFixed(2)}`}
                                color="success"
                                variant="outlined"
                                size="medium"
                              />
                              <IconButton
                                size="small"
                                onClick={() => setIsEditingPrice(true)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                        {/* {pricingDetails && (
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip
                              label={pricingDetails.pricingMethod === 'SET_PRICE' ? 'Set Price' : 'Formula'}
                              size="small"
                              variant="outlined"
                              color={pricingDetails.pricingMethod === 'SET_PRICE' ? 'info' : 'warning'}
                            />
                            {pricingDetails.originArea && pricingDetails.originArea !== 'UNKNOWN' && (
                              <Chip
                                label={`${pricingDetails.originArea} → ${pricingDetails.destinationArea}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {pricingDetails.rushHourSurcharge > 0 && (
                              <Chip
                                label={`Rush +$${pricingDetails.rushHourSurcharge}`}
                                size="small"
                                color="warning"
                              />
                            )}
                            {pricingDetails.minimumFareApplied && (
                              <Chip
                                label="Min $65"
                                size="small"
                                color="info"
                              />
                            )}
                            {formData.carSeat && (
                              <Chip
                                label="Car Seat +$10"
                                size="small"
                                color="secondary"
                              />
                            )}
                          </Box>
                        )} */}
                      </Box>
                    )}
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
                      value="zelle"
                      control={<Radio />}
                      label="Zelle"
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Enter credit card details. Card will be tokenized securely (no raw card data is stored).
                    </Typography>

                    <SquarePaymentForm
                      onTokenGenerated={handlePaymentTokenGenerated}
                      onError={handleTokenError}
                    />

                    {errors.paymentTokenId && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {errors.paymentTokenId}
                      </Typography>
                    )}
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
                    inputProps={{ min: getTodayDate() }}
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