import React, { useState, useEffect } from 'react';
import { ridesAPI, driversAPI } from '../services/dashboardService';
import './DetailView.css';

const DetailView = ({ itemType, itemId, onBackToList }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItemDetails();
  }, [itemType, itemId]);

  const loadItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (itemType === 'ride') {
        data = await ridesAPI.getById(itemId);
      } else if (itemType === 'driver') {
        data = await driversAPI.getById(itemId);
      }

      setItem(data);
    } catch (err) {
      console.error(`Failed to load ${itemType} details:`, err);
      setError(`Failed to load ${itemType} details`);
    } finally {
      setLoading(false);
    }
  };

  const renderRideDetails = (ride) => (
    <div className="detail-content">
      <div className="detail-section">
        <h3>Ride Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Ride ID:</span>
            <span className="detail-value">#{ride.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className={`detail-value status-badge ${ride.status}`}>
              {ride.status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Created:</span>
            <span className="detail-value">
              {ride.createdAt ? new Date(ride.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Estimated Time:</span>
            <span className="detail-value">{ride.estimatedTime || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Customer Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Customer ID:</span>
            <span className="detail-value">#{ride.customerId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{ride.customerName || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{ride.customerNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Route Information</h3>
        <div className="detail-grid">
          <div className="detail-item full-width">
            <span className="detail-label">Pickup Location:</span>
            <span className="detail-value">{ride.pickup}</span>
          </div>
          <div className="detail-item full-width">
            <span className="detail-label">Destination:</span>
            <span className="detail-value">{ride.destination}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Driver & Payment</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Driver ID:</span>
            <span className="detail-value">#{ride.driverId || 'Unassigned'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Driver Name:</span>
            <span className="detail-value">{ride.driverName || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Fare:</span>
            <span className="detail-value">{ride.fare || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDriverDetails = (driver) => (
    <div className="detail-content">
      <div className="detail-section">
        <h3>Driver Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Driver ID:</span>
            <span className="detail-value">#{driver.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{driver.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className={`detail-value status-badge ${driver.status}`}>
              {driver.status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Currently Driving:</span>
            <span className="detail-value">
              {driver.isCurrentlyDriving ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Contact Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{driver.phone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{driver.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Vehicle Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Vehicle:</span>
            <span className="detail-value">{driver.vehicle || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">License Number:</span>
            <span className="detail-value">{driver.licenseNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Performance</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Rating:</span>
            <span className="detail-value">
              {driver.rating ? `${driver.rating}/5.0` : 'N/A'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Rides:</span>
            <span className="detail-value">{driver.totalRides || '0'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Joined Date:</span>
            <span className="detail-value">
              {driver.joinedDate ? new Date(driver.joinedDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="detail-view">
        <div className="loading">Loading {itemType} details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-view">
        <div className="error">{error}</div>
        <button onClick={onBackToList} className="back-btn">Back to List</button>
      </div>
    );
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button onClick={onBackToList} className="back-btn">
          ← Back to List
        </button>
        <h2>
          {itemType === 'ride' ? `Ride #${item?.id}` : `Driver: ${item?.name}`}
        </h2>
        <button onClick={loadItemDetails} className="refresh-btn">
          Refresh
        </button>
      </div>

      {itemType === 'ride' && item && renderRideDetails(item)}
      {itemType === 'driver' && item && renderDriverDetails(item)}
    </div>
  );
};

export default DetailView;