import React, { useState } from 'react';
import { messageService } from '../services/messageService';
import MessagingModal from './MessagingModal';
import './MetricListView.css';

const MetricListView = ({ metricType, data, onItemClick, onBackToDashboard }) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingDriverId, setMessagingDriverId] = useState(null);
  const [messagingDriverName, setMessagingDriverName] = useState('');
  const [messagingCallId, setMessagingCallId] = useState(null);

  const handleCancelCall = async (callId) => {
    if (window.confirm('Are you sure you want to cancel this call?')) {
      try {
        await messageService.cancelCall(callId, 'Cancelled by dispatcher', 'dispatcher');
        alert('Call cancelled successfully');
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Failed to cancel call:', error);
        alert('Failed to cancel call. Please try again.');
      }
    }
  };

  const handleReassignCall = async (callId) => {
    const newDriverId = prompt('Enter new driver ID to reassign this call:');
    if (newDriverId && newDriverId.trim()) {
      try {
        await messageService.reassignCall(callId, newDriverId.trim(), 'Reassigned by dispatcher');
        alert('Call reassigned successfully');
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Failed to reassign call:', error);
        alert('Failed to reassign call. Please try again.');
      }
    }
  };

  const handlePickupCustomer = async (callId, driverId) => {
    if (window.confirm('Mark this customer as picked up?')) {
      try {
        await messageService.pickupCustomer(callId, driverId, null);
        alert('Customer pickup recorded successfully');
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Failed to record pickup:', error);
        alert('Failed to record pickup. Please try again.');
      }
    }
  };

  const handleDropoffCustomer = async (callId, driverId) => {
    if (window.confirm('Mark this customer as dropped off?')) {
      try {
        await messageService.dropoffCustomer(callId, driverId, null);
        alert('Customer dropoff recorded successfully');
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Failed to record dropoff:', error);
        alert('Failed to record dropoff. Please try again.');
      }
    }
  };

  const handleMessageDriver = (driverId, driverName, callId = null) => {
    setMessagingDriverId(driverId);
    setMessagingDriverName(driverName || `Driver #${driverId}`);
    setMessagingCallId(callId);
    setShowMessaging(true);
  };

  const handleMessagingClose = () => {
    setShowMessaging(false);
    setMessagingDriverId(null);
    setMessagingDriverName('');
    setMessagingCallId(null);
  };
  const getTitle = () => {
    switch (metricType) {
      case 'assignedRides':
        return 'Assigned Rides';
      case 'ridesInProgress':
        return 'Rides in Progress';
      case 'futureRides':
        return 'Future Rides';
      case 'todaysRides':
        return 'Today\'s Rides';
      case 'activeDrivers':
        return 'Active Drivers';
      case 'driversCurrentlyDriving':
        return 'Drivers Currently Driving';
      default:
        return 'List View';
    }
  };

  const isRideList = metricType.includes('Rides') || metricType.includes('rides');
  const isDriverList = metricType.includes('Drivers') || metricType.includes('drivers');

  const renderRideItem = (ride) => (
    <div 
      key={ride.id} 
      className="list-item ride-item"
    >
      <div className="item-header">
        <span className="item-id">Ride #{ride.id}</span>
        <span className={`status-badge ${ride.status}`}>
          {ride.status}
        </span>
      </div>
      <div className="item-details">
        <div className="detail-row">
          <span className="label">Customer:</span>
          <span className="value">{ride.customerName || `Customer #${ride.customerId}`}</span>
        </div>
        <div className="detail-row">
          <span className="label">From:</span>
          <span className="value">{ride.pickup}</span>
        </div>
        <div className="detail-row">
          <span className="label">To:</span>
          <span className="value">{ride.destination}</span>
        </div>
        {ride.driverId && (
          <div className="detail-row">
            <span className="label">Driver:</span>
            <span className="value">Driver #{ride.driverId}</span>
          </div>
        )}
        {ride.scheduledFor && (
          <div className="detail-row">
            <span className="label">Scheduled:</span>
            <span className="value">{new Date(ride.scheduledFor).toLocaleString()}</span>
          </div>
        )}
        {ride.callTime && (
          <div className="detail-row">
            <span className="label">Call Time:</span>
            <span className="value">{new Date(ride.callTime).toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="item-actions">
        <button 
          onClick={() => onItemClick('ride', ride.id)}
          className="view-btn"
        >
          View Details
        </button>
        
        {ride.driverId && (
          <button 
            onClick={() => handleMessageDriver(ride.driverId, ride.driverName, ride.id)}
            className="message-btn"
          >
            Message Driver
          </button>
        )}
        
        <button 
          onClick={() => handleCancelCall(ride.id)}
          className="cancel-btn"
        >
          Cancel Call
        </button>
        
        {ride.driverId && (
          <button 
            onClick={() => handleReassignCall(ride.id)}
            className="reassign-btn"
          >
            Reassign
          </button>
        )}

        {ride.driverId && ride.status === 'arrived' && (
          <button 
            onClick={() => handlePickupCustomer(ride.id, ride.driverId)}
            className="pickup-btn"
          >
            Mark Picked Up
          </button>
        )}

        {ride.driverId && ride.status === 'in_progress' && (
          <button 
            onClick={() => handleDropoffCustomer(ride.id, ride.driverId)}
            className="dropoff-btn"
          >
            Mark Dropped Off
          </button>
        )}
      </div>
    </div>
  );

  const renderDriverItem = (driver) => (
    <div 
      key={driver.id} 
      className="list-item driver-item"
    >
      <div className="item-header">
        <span className="item-id">Driver #{driver.id}</span>
        <span className={`status-badge ${driver.status}`}>
          {driver.status}
        </span>
      </div>
      <div className="item-details">
        <div className="detail-row">
          <span className="label">Name:</span>
          <span className="value">{driver.name}</span>
        </div>
        <div className="detail-row">
          <span className="label">Phone:</span>
          <span className="value">{driver.phone}</span>
        </div>
        <div className="detail-row">
          <span className="label">Currently Driving:</span>
          <span className="value">{driver.isCurrentlyDriving ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div className="item-actions">
        <button 
          onClick={() => onItemClick('driver', driver.id)}
          className="view-btn"
        >
          View Details
        </button>
        
        <button 
          onClick={() => handleMessageDriver(driver.id, driver.name)}
          className="message-btn"
        >
          Message Driver
        </button>
      </div>
    </div>
  );

  return (
    <div className="metric-list-view">
      <div className="list-header">
        <button onClick={onBackToDashboard} className="back-btn">
          ← Back to Dashboard
        </button>
        <h2>{getTitle()}</h2>
        <div className="list-count">{Array.isArray(data) ? data.length : 0} items</div>
      </div>

      <div className="list-content">
        {!Array.isArray(data) || data.length === 0 ? (
          <div className="empty-state">
            <p>No {getTitle().toLowerCase()} found.</p>
          </div>
        ) : (
          <div className="list-items">
            {isRideList && Array.isArray(data) && data.map(renderRideItem)}
            {isDriverList && Array.isArray(data) && data.map(renderDriverItem)}
          </div>
        )}
      </div>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={showMessaging}
        onClose={handleMessagingClose}
        driverId={messagingDriverId}
        driverName={messagingDriverName}
        callIdForPrefix={messagingCallId}
      />
    </div>
  );
};

export default MetricListView;