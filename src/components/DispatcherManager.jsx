import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminService';
import './DispatcherManager.css';

const DispatcherManager = () => {
  const [dispatchers, setDispatchers] = useState([]);
  const [filteredDispatchers, setFilteredDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    isActive: true,
    isAdmin: false,
    DateJoined: new Date().toISOString().split('T')[0],

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

    if (!editingDispatcher && !formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    loadDispatchers();
  }, []);

  useEffect(() => {
    // Filter dispatchers based on search term
    // Ensure dispatchers is always an array before filtering
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
        await adminAPI.dispatchers.update(editingDispatcher.id, formData);
      } else {
        await adminAPI.dispatchers.create(formData);
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
      password: '',
      isActive: dispatcher.isActive ?? true,
      isAdmin: dispatcher.isAdmin ?? false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (dispatcher) => {
    if (window.confirm(`Are you sure you want to delete ${dispatcher.name}?`)) {
      try {
        await adminAPI.dispatchers.delete(dispatcher.id);
        await loadDispatchers();
      } catch (error) {
        console.error('Failed to delete dispatcher:', error);
        alert('Failed to delete dispatcher. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      isActive: true,
      isAdmin: false
    });
    setValidationErrors({});
    setEditingDispatcher(null);
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="loading">Loading dispatchers...</div>;
  }

  return (
    <div className="dispatcher-manager">
      <div className="manager-header">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search dispatchers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowAddForm(true)} 
            className="add-btn"
          >
            + Add Dispatcher
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingDispatcher ? 'Edit Dispatcher' : 'Add New Dispatcher'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="dispatcher-form">
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
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={validationErrors.password ? 'error' : ''}
                  required={!editingDispatcher}
                  placeholder={editingDispatcher ? 'Leave blank to keep current password' : ''}
                />
                {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
              </div>
              
              <div className="checkbox-row">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Active
                  </label>
                </div>
                
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => handleInputChange('isAdmin', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Admin
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingDispatcher ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dispatchers-list">
        {!Array.isArray(filteredDispatchers) || filteredDispatchers.length === 0 ? (
          <div className="empty-state">
            <p>No dispatchers found.</p>
          </div>
        ) : (
          <div className="dispatchers-grid">
            {/* {console.log(dispatchers)} */}
            {filteredDispatchers.map(dispatcher => (   
                           console.log(dispatcher),

              <div key={dispatcher.id} className="dispatcher-card">
                <div className="dispatcher-info">
                  <h4>{dispatcher.name}</h4>
                  <p><strong>Email:</strong> {dispatcher.email}</p>
                  <p><strong>Phone:</strong> {dispatcher.phoneNumber}</p>
                  <p><strong>Joined:</strong> {formatDate(dispatcher.dateJoined || dispatcher.DateJoined)}</p>
                </div>
                <div className="dispatcher-actions">
                  <button onClick={() => handleEdit(dispatcher)} className="edit-btn">
                    Edit
                  </button>
                  {/* <button onClick={() => handleDelete(dispatcher)} className="delete-btn">
                    Delete
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherManager;