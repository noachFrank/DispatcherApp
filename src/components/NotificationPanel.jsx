import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Message as MessageIcon
} from '@mui/icons-material';

const NotificationPanel = ({ isOpen, onClose, unreadMessages, onMessageClick, onMarkMessagesRead, onNavigateToRideHistory }) => {
  // const [cancellationRequests, setCancellationRequests] = useState([]);
  const [driverMessages, setDriverMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const messagesArray = (unreadMessages || [])
        .map(msg => ({
          ...msg,
          formattedTime: formatMessageTime(msg.date ?? new Date())
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));


      setDriverMessages(messagesArray);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (message) => {
    if (message.driverId) {
      // Mark messages from this driver as read first
      if (onMarkMessagesRead) {
        onMarkMessagesRead(message.driverId);
      }
      // Then open the messaging modal
      if (onMessageClick) {
        onMessageClick(message.driverId);
      }
      onClose(); // Close the notification panel
    }
  };

  /**
   * Check if a message contains a clickable Cancel/Reassign/Reset Pickup pattern
   * Pattern: "Cancel Ride Request: RideId 123" or "Reassign Ride Request: RideId 123" or "Reset Pickup Request: RideId 123"
   * Returns { isClickable: boolean, rideId: string|null, type: string|null }
   */
  const parseClickableMessage = (message) => {
    if (!message) return { isClickable: false, rideId: null, type: null };

    const text = message.message || '';

    // Match patterns like "Cancel Ride Request: RideId 123"
    const cancelMatch = text.match(/Cancel Ride Request:\s*RideId\s*(\d+)/i);
    const reassignMatch = text.match(/Reassign Ride Request:\s*RideId\s*(\d+)/i);
    const resetMatch = text.match(/Reset Pickup Request:\s*RideId\s*(\d+)/i);

    if (cancelMatch) {
      return { isClickable: true, rideId: cancelMatch[1], type: 'cancel' };
    }
    if (reassignMatch) {
      return { isClickable: true, rideId: reassignMatch[1], type: 'reassign' };
    }
    if (resetMatch) {
      return { isClickable: true, rideId: resetMatch[1], type: 'resetPickup' };
    }

    return { isClickable: false, rideId: null, type: null };
  };

  /**
   * Handle click on a clickable request message
   */
  const handleRequestClick = (rideId) => {
    if (onNavigateToRideHistory && rideId) {
      onClose(); // Close the panel first
      onNavigateToRideHistory(rideId);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return 'Unknown';

    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return 'Invalid date';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 0) return 'Just now'; // Future date edge case
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes > 1440) return `${Math.floor(diffInMinutes / 1440)}d ago`;


    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      <Box sx={{ width: 400, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationIcon />
            <Typography variant="h6">Notifications</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading notifications...
            </Typography>
          </Box>
        ) : (
          <Box>

            {/* Driver Messages */}
            {driverMessages.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Driver Messages
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {driverMessages.slice(0, 10).map((message, index) => {
                    const { isClickable, rideId, type } = parseClickableMessage(message);

                    return (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: isClickable
                            ? type === 'cancel' ? '2px solid #f44336'
                              : type === 'resetPickup' ? '2px solid #ff9800'
                                : '2px solid #2196f3'
                            : '1px solid',
                          borderColor: isClickable ? undefined : 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            transform: 'translateX(4px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => isClickable ? handleRequestClick(rideId) : handleMessageClick(message)}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          {/* Request indicator for clickable messages */}
                          {isClickable && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: type === 'cancel' ? '#d32f2f' : type === 'resetPickup' ? '#f57c00' : '#1976d2',
                                fontWeight: 'bold',
                                mb: 0.5,
                              }}
                            >
                              ⚠️ {type === 'cancel' ? 'CANCEL REQUEST' : type === 'resetPickup' ? 'RESET PICKUP REQUEST' : 'REASSIGN REQUEST'} - Click to view ride
                            </Typography>
                          )}
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <MessageIcon color="primary" fontSize="small" />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {message.message}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={message.driverName || `Driver #${message.driverId}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageClick(message);
                              }}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'white'
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatMessageTime(message.date ?? new Date())}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            )}

            {driverMessages.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No new notifications
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;