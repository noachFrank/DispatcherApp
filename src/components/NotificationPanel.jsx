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

const NotificationPanel = ({ isOpen, onClose, unreadMessages }) => {
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
          formattedTime: formatMessageTime(msg.date)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));


      setDriverMessages(messagesArray);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  //   const handleApproveCancellation = async (request) => {
  //     try {
  //       // Extract call ID from message
  //       const callIdMatch = request.message.match(/Re Call #(\d+)/);
  //       const callId = callIdMatch ? callIdMatch[1] : null;

  //       if (!callId) {
  //         alert('Could not extract call ID from request');
  //         return;
  //       }

  //       const isCustomerCancellation = request.message.includes('Customer Canceled Ride');

  //       if (isCustomerCancellation) {
  //         // Cancel the call completely
  //         await messageService.cancelCall(callId, 'Customer cancellation approved by dispatcher', 'dispatcher');
  //         alert('Call cancelled successfully');
  //       } else {
  //         // Driver cancellation - need to reassign
  //         const newDriverId = prompt('Enter driver ID to reassign this call to (or leave empty to cancel):');
  //         if (newDriverId && newDriverId.trim()) {
  //           await messageService.reassignCall(callId, newDriverId.trim(), 'Reassigned after driver cancellation');
  //           alert('Call reassigned successfully');
  //         } else {
  //           await messageService.cancelCall(callId, 'No replacement driver available', 'dispatcher');
  //           alert('Call cancelled - no replacement driver');
  //         }
  //       }

  //       // Remove from requests and reload
  //       loadNotifications();
  //     } catch (error) {
  //       console.error('Failed to handle cancellation:', error);
  //       alert('Failed to process cancellation. Please try again.');
  //     }
  //   };

  //   const handleDenyCancellation = async (request) => {
  //     try {
  //       // Send message back to driver denying the cancellation
  //       await messageService.sendMessageToDriver(
  //         request.driverId,
  //         'Your cancellation request has been denied. Please continue with the ride.',
  //         request.callId
  //       );

  //       alert('Cancellation denied and driver notified');
  //       loadNotifications();
  //     } catch (error) {
  //       console.error('Failed to deny cancellation:', error);
  //       alert('Failed to deny cancellation. Please try again.');
  //     }
  //   };

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
            {/* Cancellation Requests */}
            {/* {cancellationRequests.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom color="error">
                  Cancellation Requests
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {cancellationRequests.map((request, index) => (
                    <Card key={index} variant="outlined" sx={{ border: '1px solid', borderColor: 'error.light' }}>
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {request.message}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip
                            label={`Driver #${request.driverId}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatMessageTime(request.timestamp)}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          onClick={() => handleApproveCancellation(request)}
                          color="success"
                          size="small"
                          startIcon={<CheckIcon />}
                          variant="outlined"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleDenyCancellation(request)}
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          variant="outlined"
                        >
                          Deny
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )} */}

            {/* Driver Messages */}
            {driverMessages.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Driver Messages
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {driverMessages.slice(0, 10).map((message, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="body2" gutterBottom>
                          {message.message}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip
                            label={`Driver #${message.driverId}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatMessageTime(message.date)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
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