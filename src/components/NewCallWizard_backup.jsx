import { useState } from 'react';
import { callsAPI } from '../services/apiService';
import { ridesAPI, buildNewRideData, handleCreditCardStorage } from '../services/dashboardService';
import './NewCallWizard.css';

const NewCallWizard = ({ onComplete, onCancel }) => {
  const [formData, setFormData] = useState({
    // Ride object fields
    customerName: '',
    customerPhoneNumber: '',
    callTime: new Date().toISOString(),
    pickupTime: null,
    dropOffTime: null,
    cost: 0,
    driversCompensation: null,
    paidTime: null,
    assignedToId: null,
    reassignedToId: null,
    notes: '',
    dispatchedById: null,
    paymentType: 'cash',
    
    // Route object fields
    pickup: '',
    dropOff: '',
    additionalStops: [],
    roundTrip: false,
    
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
  };



  };

  const addStop = () => {
    if (formData.additionalStops.length < 4) {
      setFormData(prev => ({
        ...prev,
        additionalStops: [...prev.additionalStops, '']
      }));
    }
  };

  const removeStop = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalStops: prev.additionalStops.filter((_, i) => i !== index)
    }));
  };

  const updateStop = (index, value) => {
    setFormData(prev => ({
      ...prev,
      additionalStops: prev.additionalStops.map((stop, i) => 
        i === index ? value : stop
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

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
      newErrors.dropOff = 'Dropoff location is required';
    }
    
    if (!formData.cost || formData.cost <= 0) {
      newErrors.cost = 'Cost is required and must be greater than 0';
    }

    if (formData.paymentType === 'creditCard') {
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
        newErrors.zipCode = 'Zip code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build new ride object matching C# API structure
  const buildNewRideObject = () => {
    const rideData = {
      customerName: formData.customerName,
      customerPhoneNumber: formData.customerPhoneNumber.replace(/\D/g, ''), // Store digits only
      callTime: scheduledDate && scheduledTime ? 
        new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : new Date().toISOString(),
      pickupTime: null,
      dropOffTime: null,
      cost: parseFloat(formData.cost) || 0,
      driversCompensation: null,
      paidTime: null,
      assignedToId: null,
      reassignedToId: null,
      notes: formData.notes || '',
      dispatchedById: null,
      paymentType: formData.paymentType,
      route: {
        pickup: formData.pickup,
        dropOff: formData.dropOff,
        stop1: formData.additionalStops[0] || null,
        stop2: formData.additionalStops[1] || null,
        stop3: formData.additionalStops[2] || null,
        stop4: formData.additionalStops[3] || null,
        roundTrip: formData.roundTrip
      }
    };

    return rideData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the ride object according to C# API structure
      const rideData = buildNewRideObject();
      
      // Handle credit card storage if needed
      if (formData.paymentType === 'creditCard') {
        await handleCreditCardStorage({
          ccNumber: formData.ccNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          zipCode: formData.zipCode
        });
      }

      // Submit to API
      const response = await ridesAPI.create(rideData);
      
      if (response.success) {
        alert('Call created successfully!');
        onComplete(response.data);
      } else {
        throw new Error(response.message || 'Failed to create call');
      }
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Failed to create call: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleClick = () => {
    if (!validateForm()) return;
    setShowDatePicker(true);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time for scheduling');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Handle credit card storage if CC payment
      const ccStorageKey = handleCreditCardStorage(formData);
      if (ccStorageKey) {
        console.log('Credit card details saved locally with key:', ccStorageKey);
      }

      // Build NewRide data structure with scheduled pickup time
      const newRideData = buildNewRideObject(scheduledDateTime.toISOString());
      
      console.log('Creating scheduled ride with data:', newRideData);
      const result = await ridesAPI.create(newRideData);
      console.log('Ride scheduled successfully:', result);

      // Call onComplete with the result
      onComplete(result);
      
      // Reset form and schedule picker
      clearForm();
      setShowDatePicker(false);
      setScheduledDate('');
      setScheduledTime('');
      
      alert('Call scheduled!');
    } catch (error) {
      console.error('Failed to schedule ride:', error);
      alert('Failed to schedule ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      customerName: '',
      customerPhoneNumber: '',
      callTime: new Date().toISOString(),
      pickupTime: null,
      dropOffTime: null,
      cost: 0,
      driversCompensation: null,
      paidTime: null,
      assignedToId: null,
      reassignedToId: null,
      notes: '',
      dispatchedById: null,
      paymentType: 'cash',
      pickup: '',
      dropOff: '',
      additionalStops: [],
      roundTrip: false,
      ccNumber: '',
      expiryDate: '',
      cvv: '',
      zipCode: ''
    });
    setErrors({});
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="new-call-form">
      <div className="form-header">
        <h2>New Call Request</h2>
        <button onClick={onCancel} className="cancel-btn">
          ×
        </button>
      </div>
      
      <div className="form-content">
        {/* Left Side - Call Details */}
        <div className="call-details-section">
          <h3>Call Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name</label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={errors.customerName ? 'error' : ''}
                placeholder="Enter customer name (optional)"
              />
              {errors.customerName && <span className="error-text">{errors.customerName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="customerPhoneNumber">Customer Phone Number *</label>
              <input
                type="tel"
                id="customerPhoneNumber"
                value={formData.customerPhoneNumber}
                onChange={(e) => handleInputChange('customerPhoneNumber', e.target.value)}
                className={errors.customerPhoneNumber ? 'error' : ''}
                placeholder="(555) 123-4567"
                maxLength="14"
                required
              />
              {errors.customerPhoneNumber && <span className="error-text">{errors.customerPhoneNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pickup">Pickup Location *</label>
              <input
                type="text"
                id="pickup"
                value={formData.pickup}
                onChange={(e) => handleInputChange('pickup', e.target.value)}
                className={errors.pickup ? 'error' : ''}
                placeholder="Enter pickup address"
                required
              />
              {errors.pickup && <span className="error-text">{errors.pickup}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="dropOff">Drop-off Location *</label>
              <input
                type="text"
                id="dropOff"
                value={formData.dropOff}
                onChange={(e) => handleInputChange('dropOff', e.target.value)}
                className={errors.dropOff ? 'error' : ''}
                placeholder="Enter drop-off address"
              />
              {errors.dropOff && <span className="error-text">{errors.dropOff}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.roundTrip}
                  onChange={(e) => handleInputChange('roundTrip', e.target.checked)}
                />
                <span className="checkmark"></span>
                Round Trip
              </label>
            </div>
          </div>

          {/* Additional Stops */}
          <div className="additional-stops-section">
            <div className="stops-header">
              <label>Additional Stops</label>
              <button type="button" onClick={addStop} className="add-stop-btn">
                + Add Stop
              </button>
            </div>
            
            {formData.additionalStops.map((stop, index) => (
              <div key={index} className="stop-input-group">
                <input
                  type="text"
                  value={stop}
                  onChange={(e) => updateStop(index, e.target.value)}
                  placeholder={`Stop ${index + 1} address`}
                  className="stop-input"
                />
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="remove-stop-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Cost */}
          <div className="form-group">
            <label htmlFor="cost">Estimated Cost *</label>
            <input
              type="number"
              id="cost"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              className={errors.cost ? 'error' : ''}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            {errors.cost && <span className="error-text">{errors.cost}</span>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes for this ride..."
              rows={3}
            />
          </div>
        </div>

        {/* Right Side - Payment Info */}
        <div className="payment-section">
          <h3>Payment Information</h3>
          
          <div className="payment-type-section">
            <label className="section-label">Payment Method</label>
            <div className="payment-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="cash"
                  checked={formData.paymentType === 'cash'}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                />
                <span className="radio-button"></span>
                Cash
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="check"
                  checked={formData.paymentType === 'check'}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                />
                <span className="radio-button"></span>
                Check
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="creditCard"
                  checked={formData.paymentType === 'creditCard'}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                />
                <span className="radio-button"></span>
                Credit Card
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="paymentType"
                  value="voucher"
                  checked={formData.paymentType === 'voucher'}
                  onChange={(e) => handleInputChange('paymentType', e.target.value)}
                />
                <span className="radio-button"></span>
                Voucher
              </label>
            </div>
          </div>

          {/* Credit Card Fields */}
          {formData.paymentType === 'creditCard' && (
            <div className="credit-card-section">
              <h4>Credit Card Information</h4>
              
              <div className="form-group full-width">
                <label htmlFor="ccNumber">Card Number *</label>
                <input
                  type="text"
                  id="ccNumber"
                  value={formData.ccNumber}
                  onChange={(e) => handleInputChange('ccNumber', e.target.value)}
                  className={errors.ccNumber ? 'error' : ''}
                  placeholder="1234 5678 9012 3456"
                />
                {errors.ccNumber && <span className="error-text">{errors.ccNumber}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date *</label>
                  <input
                    type="text"
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={errors.expiryDate ? 'error' : ''}
                    placeholder="MM/YY"
                  />
                  {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="cvv">CVV *</label>
                  <input
                    type="text"
                    id="cvv"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className={errors.cvv ? 'error' : ''}
                    placeholder="123"
                  />
                  {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="zipCode">Zip Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className={errors.zipCode ? 'error' : ''}
                    placeholder="12345"
                  />
                  {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Date/Time Picker */}
      {showDatePicker && (
        <div className="schedule-section">
          <h4>Schedule Call</h4>
          <div className="datetime-inputs">
            <div className="form-group">
              <label htmlFor="scheduledDate">Date:</label>
              <input
                type="date"
                id="scheduledDate"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getTomorrowDate()}
              />
            </div>
            <div className="form-group">
              <label htmlFor="scheduledTime">Time:</label>
              <input
                type="time"
                id="scheduledTime"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
          <div className="schedule-actions">
            <button 
              type="button" 
              onClick={() => setShowDatePicker(false)}
              className="cancel-schedule-btn"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleScheduleSubmit}
              disabled={isSubmitting}
              className="confirm-schedule-btn"
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="form-actions">
        <button 
          type="button" 
          onClick={handleScheduleClick}
          disabled={isSubmitting || showDatePicker}
          className="schedule-btn"
        >
          Schedule Call
        </button>
        <button 
          type="button" 
          onClick={handleSubmit}
          disabled={isSubmitting || showDatePicker}
          className="submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Now'}
        </button>
      </div>
    </div>
  );
};

export default NewCallWizard;