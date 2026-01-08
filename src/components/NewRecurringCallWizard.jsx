import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Checkbox,
    Grid,
    IconButton,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    InputLabel,
    Autocomplete,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Radio
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Close as CloseIcon,
    Repeat as RepeatIcon,
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

// Days of the week (0 = Sunday, 6 = Saturday)
const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const NewRecurringCallWizard = ({ onComplete, onCancel }) => {
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
        estimatedDuration: 0,

        // Payment token (Square tokenization)
        paymentTokenId: null
    });

    // Recurring-specific state
    const [dayConfigs, setDayConfigs] = useState(
        DAYS_OF_WEEK.map(day => ({
            dayOfWeek: day.value,
            enabled: false,
            time: '',
            endDate: ''
        }))
    );

    const [errors, setErrors] = useState({});
    const phoneInputRef = useRef(null);
    const stopRefs = useRef([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
    const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
    const [pricingDetails, setPricingDetails] = useState(null);
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [addressesValidated, setAddressesValidated] = useState({ pickup: false, dropOff: false });
    const [stopsValidated, setStopsValidated] = useState([]);

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
        const phoneNumber = value.replace(/\D/g, '');
        if (phoneNumber.length >= 6) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
        } else if (phoneNumber.length >= 3) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        return phoneNumber;
    };

    const extractPhoneDigits = (value) => {
        return value.replace(/\D/g, '');
    };

    const handlePhoneBackspace = (e, fieldName) => {
        if (e.key === 'Backspace') {
            const input = e.target;
            const cursorPos = input.selectionStart;
            const value = input.value;
            const charBefore = value[cursorPos - 1];

            if (cursorPos > 0 && (charBefore === '(' || charBefore === ')' || charBefore === ' ' || charBefore === '-')) {
                e.preventDefault();
                let removeCount;
                if (charBefore === ' ') {
                    removeCount = Math.min(cursorPos, 3);
                } else if (charBefore === '(') {
                    removeCount = cursorPos >= 2 ? 2 : 1;
                } else {
                    removeCount = cursorPos >= 2 ? 2 : 1;
                }
                const newValue = value.slice(0, cursorPos - removeCount) + value.slice(cursorPos);
                handleInputChange(fieldName, newValue);
            }
        }
    };

    const handleInputChange = (field, value) => {
        let processedValue = value;

        if (field === 'customerPhoneNumber') {
            const input = phoneInputRef.current;
            const cursorPos = input?.selectionStart || 0;
            const oldValue = formData.customerPhoneNumber || '';
            const oldDigits = extractPhoneDigits(oldValue);
            const newDigits = extractPhoneDigits(value);
            processedValue = formatPhoneNumber(newDigits);

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

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        if (field === 'dropOff' || field === 'pickup') {
            setAddressesValidated(prev => ({
                ...prev,
                [field]: false
            }));
        }
    };

    // Calculate route when addresses change
    const calculateTripRoute = async () => {
        if (!googleMapsLoaded || !formData.pickup || !formData.dropOff) {
            setRouteInfo({ distance: '', duration: '' });
            setFormData(prev => ({ ...prev, estimatedDuration: 0, cost: 0, driversCompensation: 0 }));
            setPricingDetails(null);
            return;
        }

        if (!addressesValidated.pickup || !addressesValidated.dropOff) {
            return;
        }

        setIsCalculatingRoute(true);
        setIsCalculatingPrice(true);
        try {
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

            await calculatePricing(validatedStops);
        } catch (error) {
            setRouteInfo({ distance: '', duration: '' });
        } finally {
            setIsCalculatingRoute(false);
        }
    };

    // Calculate pricing
    const calculatePricing = async (validatedStops = []) => {
        try {
            // Use the first enabled day's time for pricing calculation, or empty if none
            const firstEnabledDay = dayConfigs.find(d => d.enabled && d.time);
            let scheduledDateTime = null;
            if (firstEnabledDay) {
                const today = new Date();
                scheduledDateTime = new Date(`${today.toISOString().split('T')[0]}T${firstEnabledDay.time}`).toISOString();
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
                const carSeatSurcharge = formData.carSeat ? formData.roundTrip ? 20 : 10 : 0;
                setFormData(prev => ({
                    ...prev,
                    cost: Math.round(response.totalPrice) + carSeatSurcharge,
                    driversCompensation: Math.round(response.driversCompensation)
                }));
            } else {
                setPricingDetails(null);
                setFormData(prev => ({
                    ...prev,
                    cost: 0,
                    driversCompensation: 0
                }));
            }
        } catch (error) {
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.pickup && formData.dropOff && addressesValidated.pickup && addressesValidated.dropOff) {
                calculateTripRoute();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.pickup, formData.dropOff, formData.additionalStops, formData.roundTrip, formData.carType, formData.carSeat, dayConfigs, googleMapsLoaded, addressesValidated, stopsValidated]);

    const handleAddressSelect = (field, address, placeDetails) => {
        setFormData(prev => ({
            ...prev,
            [field]: address
        }));
        setAddressesValidated(prev => ({
            ...prev,
            [field]: true
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleStopSelect = (index, address, placeDetails) => {
        const newStops = [...formData.additionalStops];
        newStops[index] = address;
        setFormData(prev => ({
            ...prev,
            additionalStops: newStops
        }));
        setStopsValidated(prev => {
            if (!prev.includes(index)) {
                return [...prev, index];
            }
            return prev;
        });
    };

    const addStop = () => {
        if (formData.additionalStops.length >= 10) {
            showAlert('Maximum Stops', 'Maximum 10 stops allowed', [{ text: 'OK' }], 'warning');
            return;
        }
        const newStops = [...formData.additionalStops, ''];
        setFormData(prev => ({
            ...prev,
            additionalStops: newStops
        }));
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
        setStopsValidated(prev => prev.filter(i => i !== index));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.customerPhoneNumber.trim()) {
            newErrors.customerPhoneNumber = 'Phone number is required';
        } else {
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

        if (!formData.passengers || formData.passengers < 1) {
            newErrors.passengers = 'At least 1 passenger is required';
        }

        // Validate recurring-specific fields
        const enabledDays = dayConfigs.filter(d => d.enabled);
        if (enabledDays.length === 0) {
            newErrors.dayConfigs = 'Select at least one day';
        } else {
            // Validate each enabled day has time and end date
            enabledDays.forEach(day => {
                if (!day.time) {
                    newErrors[`day_${day.dayOfWeek}_time`] = 'Time required';
                }
                if (!day.endDate) {
                    newErrors[`day_${day.dayOfWeek}_endDate`] = 'End date required';
                } else {
                    const selectedEndDate = new Date(day.endDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedEndDate < today) {
                        newErrors[`day_${day.dayOfWeek}_endDate`] = 'Must be in future';
                    }
                }
            });
        }

        if (formData.paymentType === 'dispatcherCC') {
            if (!formData.paymentTokenId) {
                newErrors.paymentTokenId = 'Please enter credit card information';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Get the next occurrence of a given day of week from today
    const getNextOccurrence = (dayOfWeek, time) => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);

        let result = new Date(now);
        result.setHours(hours, minutes, 0, 0);

        // Calculate days until next occurrence
        const currentDay = now.getDay();
        let daysUntilNext = dayOfWeek - currentDay;

        // If the day is today but time has passed, or day is in the past, go to next week
        if (daysUntilNext < 0 || (daysUntilNext === 0 && result <= now)) {
            daysUntilNext += 7;
        }

        result.setDate(result.getDate() + daysUntilNext);
        return result;
    };

    const handlePaymentTokenGenerated = (token, cardholderName) => {
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
        // If payment type is Dispatcher CC and no token yet, try to tokenize
        if (formData.paymentType === 'dispatcherCC' && !formData.paymentTokenId) {
            if (window.squareTokenizeCard) {
                try {
                    await window.squareTokenizeCard();
                    // Wait a moment for the token to be set via callback
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (tokenError) {
                    console.error('❌ Tokenization failed during submission:', tokenError);
                    // Validation will catch the missing token and show error
                }
            } else {
                console.warn('⚠️ Square tokenization function not available');
            }
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {

            // Create one ride for each enabled day
            const ridesCreated = [];
            const enabledDays = dayConfigs.filter(d => d.enabled);

            for (const dayConfig of enabledDays) {
                const scheduledFor = getNextOccurrence(dayConfig.dayOfWeek, dayConfig.time);
                const now = new Date();

                // Convert estimatedDuration to TimeOnly format
                const durationMinutes = formData.estimatedDuration || 0;
                const hours = Math.floor(durationMinutes / 60);
                const minutes = Math.floor(durationMinutes % 60);
                const estimatedDurationTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

                // Build ride object
                const rideObject = {
                    rideId: 0,
                    routeId: 0,
                    customerName: formData.customerName,
                    customerPhoneNumber: formData.customerPhoneNumber.replace(/\D/g, ''),
                    callTime: now.toISOString(),
                    scheduledFor: scheduledFor.toISOString(),
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
                    isReoccurring: true,
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
                        callTime: now.toISOString(),
                        estimatedDuration: estimatedDurationTime,
                    }
                };

                // Build recurring object with unique time and end date
                const recurringObject = {
                    id: 0,
                    dayOfWeek: dayConfig.dayOfWeek,
                    time: `${dayConfig.time}:00`, // Add seconds for TimeOnly format (HH:mm:ss)
                    endDate: new Date(dayConfig.endDate).toISOString()
                };

                // Send via SignalR
                if (signalRConnection) {
                    await signalRConnection.invoke("NewCallCreated", rideObject, recurringObject);
                    ridesCreated.push({ ride: rideObject, day: DAYS_OF_WEEK.find(d => d.value === dayConfig.dayOfWeek)?.label });
                }
            }

            soundService.playCallSentSound();

            const daysStr = ridesCreated.map(r => r.day).join(', ');
            showToast(`Recurring call created for: ${daysStr}`, 'success');

            clearForm();
            onComplete(ridesCreated);
        } catch (error) {
            console.error('Failed to create recurring ride:', error);
            showAlert('Error', 'Failed to create recurring ride. Please try again.', [{ text: 'OK' }], 'error');
        } finally {
            setIsSubmitting(false);
        }
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
            carType: 0,
            carSeat: false,
            assignedToId: null,
            assignedToName: '',
            flightNumber: '',
            pickup: '',
            dropOff: '',
            additionalStops: [],
            roundTrip: false,
            estimatedDuration: 0,
            paymentTokenId: null
        });
        setDayConfigs(
            DAYS_OF_WEEK.map(day => ({
                dayOfWeek: day.value,
                enabled: false,
                time: '',
                endDate: ''
            }))
        );
        setErrors({});
        setRouteInfo({ distance: '', duration: '' });
        setAddressesValidated({ pickup: false, dropOff: false });
        setStopsValidated([]);
        setPricingDetails(null);
        setIsEditingPrice(false);
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleDayToggle = (dayOfWeek) => {
        setDayConfigs(prev => prev.map(day =>
            day.dayOfWeek === dayOfWeek
                ? { ...day, enabled: !day.enabled }
                : day
        ));
        if (errors.dayConfigs) {
            setErrors(prev => ({ ...prev, dayConfigs: '' }));
        }
    };

    const handleDayTimeChange = (dayOfWeek, time) => {
        setDayConfigs(prev => prev.map(day =>
            day.dayOfWeek === dayOfWeek
                ? { ...day, time }
                : day
        ));
        if (errors[`day_${dayOfWeek}_time`]) {
            setErrors(prev => ({ ...prev, [`day_${dayOfWeek}_time`]: '' }));
        }
    };

    const handleDayEndDateChange = (dayOfWeek, endDate) => {
        setDayConfigs(prev => prev.map(day =>
            day.dayOfWeek === dayOfWeek
                ? { ...day, endDate }
                : day
        ));
        if (errors[`day_${dayOfWeek}_endDate`]) {
            setErrors(prev => ({ ...prev, [`day_${dayOfWeek}_endDate`]: '' }));
        }
    };

    return (
        <Dialog open={true} onClose={onCancel} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        <RepeatIcon color="primary" />
                        <Typography variant="h5">New Recurring Call</Typography>
                    </Box>
                    <IconButton onClick={onCancel}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This will create a recurring ride that repeats on selected days until the end date
                </Typography>
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
                                                label={<Typography variant="caption">Needs Car Seat</Typography>}
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

                        {/* Recurring Schedule Section */}
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RepeatIcon /> Recurring Schedule
                                </Typography>

                                {errors.dayConfigs && (
                                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2 }}>
                                        {errors.dayConfigs}
                                    </Typography>
                                )}

                                <Grid container spacing={2}>
                                    {dayConfigs.map((dayConfig) => (
                                        <Grid item xs={12} key={dayConfig.dayOfWeek}>
                                            <Paper
                                                elevation={dayConfig.enabled ? 2 : 0}
                                                sx={{
                                                    p: 2,
                                                    border: dayConfig.enabled ? 2 : 1,
                                                    borderColor: dayConfig.enabled ? 'primary.main' : 'divider',
                                                    bgcolor: dayConfig.enabled ? 'action.selected' : 'background.paper'
                                                }}
                                            >
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} sm={3}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={dayConfig.enabled}
                                                                    onChange={() => handleDayToggle(dayConfig.dayOfWeek)}
                                                                    color="primary"
                                                                />
                                                            }
                                                            label={
                                                                <Typography variant="body1" fontWeight={dayConfig.enabled ? 'bold' : 'normal'}>
                                                                    {DAYS_OF_WEEK.find(d => d.value === dayConfig.dayOfWeek)?.label}
                                                                </Typography>
                                                            }
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Time"
                                                            type="time"
                                                            value={dayConfig.time}
                                                            onChange={(e) => handleDayTimeChange(dayConfig.dayOfWeek, e.target.value)}
                                                            disabled={!dayConfig.enabled}
                                                            error={!!errors[`day_${dayConfig.dayOfWeek}_time`]}
                                                            helperText={errors[`day_${dayConfig.dayOfWeek}_time`]}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ step: 300 }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={5}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="End Date"
                                                            type="date"
                                                            value={dayConfig.endDate}
                                                            onChange={(e) => handleDayEndDateChange(dayConfig.dayOfWeek, e.target.value)}
                                                            disabled={!dayConfig.enabled}
                                                            error={!!errors[`day_${dayConfig.dayOfWeek}_endDate`]}
                                                            helperText={errors[`day_${dayConfig.dayOfWeek}_endDate`]}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: getTodayDate() }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Right Side - Payment Info */}
                        <Card sx={{ mt: 2 }}>
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


            </DialogContent>


            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                    color="primary"
                >
                    {isSubmitting ? 'Creating...' : `Create Recurring Call (${dayConfigs.filter(d => d.enabled).length} ${dayConfigs.filter(d => d.enabled).length === 1 ? 'day' : 'days'})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewRecurringCallWizard;