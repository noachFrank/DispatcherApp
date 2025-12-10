import React, { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [driverMessages, setDriverMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Set up polling for new notifications
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Load driver messages that contain cancellation requests
      const messages = await messageService.getDispatcherMessages();
      
      // Filter cancellation requests
      const cancellations = messages.filter(msg => 
        msg.message.includes('Re Call #') && 
        (msg.message.includes('Customer Canceled Ride') || msg.message.includes('Reassign Please'))
      );
      
      // Filter general driver messages
      const generalMessages = messages.filter(msg => 
        !msg.message.includes('Customer Canceled Ride') && 
        !msg.message.includes('Reassign Please')
      );
      
      setCancellationRequests(cancellations);
      setDriverMessages(generalMessages);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCancellation = async (request) => {
    try {
      // Extract call ID from message
      const callIdMatch = request.message.match(/Re Call #(\d+)/);
      const callId = callIdMatch ? callIdMatch[1] : null;
      
      if (!callId) {
        alert('Could not extract call ID from request');
        return;
      }

      const isCustomerCancellation = request.message.includes('Customer Canceled Ride');
      
      if (isCustomerCancellation) {
        // Cancel the call completely
        await messageService.cancelCall(callId, 'Customer cancellation approved by dispatcher', 'dispatcher');
        alert('Call cancelled successfully');
      } else {
        // Driver cancellation - need to reassign
        const newDriverId = prompt('Enter driver ID to reassign this call to (or leave empty to cancel):');
        if (newDriverId && newDriverId.trim()) {
          await messageService.reassignCall(callId, newDriverId.trim(), 'Reassigned after driver cancellation');
          alert('Call reassigned successfully');
        } else {
          await messageService.cancelCall(callId, 'No replacement driver available', 'dispatcher');
          alert('Call cancelled - no replacement driver');
        }
      }
      
      // Remove from requests and reload
      loadNotifications();
    } catch (error) {
      console.error('Failed to handle cancellation:', error);
      alert('Failed to process cancellation. Please try again.');
    }
  };

  const handleDenyCancellation = async (request) => {
    try {
      // Send message back to driver denying the cancellation
      await messageService.sendMessageToDriver(
        request.driverId, 
        'Your cancellation request has been denied. Please continue with the ride.',
        request.callId
      );
      
      alert('Cancellation denied and driver notified');
      loadNotifications();
    } catch (error) {
      console.error('Failed to deny cancellation:', error);
      alert('Failed to deny cancellation. Please try again.');
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay">
      <div className="notification-panel">
        <div className="notification-header">
          <h3>Notifications</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : (
            <>
              {/* Cancellation Requests */}
              {cancellationRequests.length > 0 && (
                <div className="notification-section">
                  <h4>Cancellation Requests</h4>
                  <div className="notification-list">
                    {cancellationRequests.map((request, index) => (
                      <div key={index} className="notification-item cancellation-request">
                        <div className="notification-content-text">
                          <div className="notification-message">{request.message}</div>
                          <div className="notification-meta">
                            <span>From: Driver #{request.driverId}</span>
                            <span>{formatMessageTime(request.timestamp)}</span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button 
                            onClick={() => handleApproveCancellation(request)}
                            className="approve-btn"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleDenyCancellation(request)}
                            className="deny-btn"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver Messages */}
              {driverMessages.length > 0 && (
                <div className="notification-section">
                  <h4>Driver Messages</h4>
                  <div className="notification-list">
                    {driverMessages.slice(0, 10).map((message, index) => (
                      <div key={index} className="notification-item driver-message">
                        <div className="notification-content-text">
                          <div className="notification-message">{message.message}</div>
                          <div className="notification-meta">
                            <span>From: Driver #{message.driverId}</span>
                            <span>{formatMessageTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cancellationRequests.length === 0 && driverMessages.length === 0 && (
                <div className="no-notifications">
                  <p>No new notifications</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;