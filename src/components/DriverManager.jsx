import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminService';
import { messageService } from '../services/messageService';
import CarManager from './CarManager';
import MessagingModal from './MessagingModal';
import './DriverManager.css';

const DriverManager = () => {
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
    password: '',
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

    if (!editingDriver && !formData.password.trim()) {
      errors.password = 'Password is required';
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
    // Filter drivers based on search term
    // Ensure drivers is always an array before filtering
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
      
      // Ensure data is always an array
      const driversArray = Array.isArray(data) ? data : [];
      
      setDrivers(driversArray);
      setFilteredDrivers(driversArray);
      
      // Load unread counts for all drivers
      await loadUnreadCounts();
    } catch (error) {
      console.error('Failed to load drivers:', error);
      // Set empty arrays on error
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
      
      // Load unread counts for each driver
      await Promise.all(
        driversArray.map(async (driver) => {
          try {
            const countData = await messageService.getUnreadCount(driver.id);
            counts[driver.id] = countData.count || 0;
          } catch (error) {
            console.error(`Failed to load unread count for driver ${driver.id}:`, error);
            counts[driver.id] = 0;
          }
        })
      );
      
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
        await adminAPI.drivers.update(editingDriver.id, formData);
      } else {
        await adminAPI.drivers.create(formData);
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
      license: driver.license,
      password: ''
    });
    setShowAddForm(true);
  };

  const handleEditCars = (driver) => {
    setSelectedDriverId(driver.id);
    setShowCarManager(true);
  };

  const handleMessage = (driver) => {
    setMessagingDriverId(driver.id);
    setMessagingDriverName(driver.name);
    setShowMessaging(true);
  };

  const handleDelete = async (driver) => {
    if (window.confirm(`Are you sure you want to delete ${driver.name}?`)) {
      try {
        await adminAPI.drivers.delete(driver.id);
        await loadDrivers();
      } catch (error) {
        console.error('Failed to delete driver:', error);
        alert('Failed to delete driver. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      license: '',
      password: ''
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
    return <div className="loading">Loading drivers...</div>;
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
    <div className="driver-manager">
      <div className="manager-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search drivers by name, email, phone, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowAddForm(true)} 
            className="add-btn"
          >
            + Add Driver
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="driver-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={validationErrors.name ? 'error' : ''}
                  required
                />
                {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={validationErrors.email ? 'error' : ''}
                  required
                />
                {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={validationErrors.phoneNumber ? 'error' : ''}
                  placeholder="(555) 123-4567"
                  maxLength="14"
                  required
                />
                {validationErrors.phoneNumber && <span className="error-message">{validationErrors.phoneNumber}</span>}
              </div>
              
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => handleInputChange('license', e.target.value)}
                  className={validationErrors.license ? 'error' : ''}
                  placeholder="ABC123DEF45"
                  maxLength="15"
                  required
                />
                {validationErrors.license && <span className="error-message">{validationErrors.license}</span>}
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={validationErrors.password ? 'error' : ''}
                  required={!editingDriver}
                  placeholder={editingDriver ? 'Leave blank to keep current password' : ''}
                />
                {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingDriver ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="drivers-list">
        {!Array.isArray(filteredDrivers) || filteredDrivers.length === 0 ? (
          <div className="empty-state">
            <p>No drivers found.</p>
          </div>
        ) : (
          <div className="drivers-grid">
            {filteredDrivers.map(driver => (
              <div key={driver.id} className="driver-card">
                <div className="driver-info">
                  <h4>{driver.name}</h4>
                  <p><strong>Email:</strong> {driver.email}</p>
                  <p><strong>Phone:</strong> {driver.phoneNumber}</p>
                  <p><strong>License:</strong> {driver.license}</p>
                  {/* <p><strong>Rating:</strong> ⭐ {driver.rating}/5.0</p> */}
                  <p><strong>Joined:</strong> {new Date(driver.joinedDate).toLocaleDateString()}</p>
                </div>
                <div className="driver-actions">
                  <button onClick={() => handleEdit(driver)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleEditCars(driver)} className="cars-btn">
                    Edit Cars
                  </button>
                  <div className="message-btn-container">
                    <button onClick={() => handleMessage(driver)} className="message-btn">
                      Message
                    </button>
                    {driverUnreadCounts[driver.id] > 0 && (
                      <span className="unread-badge">
                        {driverUnreadCounts[driver.id]}
                      </span>
                    )}
                  </div>
                  {/* <button onClick={() => handleDelete(driver)} className="delete-btn">
                    Delete
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={showMessaging}
        onClose={handleMessagingClose}
        driverId={messagingDriverId}
        driverName={messagingDriverName}
      />
    </div>
  );
};

export default DriverManager;