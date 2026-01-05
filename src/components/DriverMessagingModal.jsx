/**
 * DriverMessagingModal.jsx
 * 
 * A modal dialog for dispatcher-to-driver messaging.
 * 
 * FEATURES:
 * - Opens as a modal dialog when clicking "Message Driver" on any ride or driver
 * - Fetches today's conversation from /api/Communication/TodaysCom?driverId={driverId}
 * - Chat-style UI with dispatcher messages on right side (green), driver messages on left (white)
 * - Text input at bottom with send button
 * - Messages sent via SignalR using DispatcherSendsMessage socket
 * - Auto-scrolls to latest message
 * - Marks driver's messages as read when modal opens
 * 
 * PROPS:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * - driverId: number - The driver to message
 * - driverName: string - Display name of the driver
 * - rideContext: object (optional) - { rideId, customerName, customerPhone } - If provided, messages are prefixed with ride info
 * 
 * REAL-TIME:
 * - Listens for ReceiveMessage SignalR events for incoming messages from the driver
 * - Incoming messages are added to the conversation immediately
 * 
 * DATA STRUCTURE (Communication from server):
 * - id: number
 * - message: string
 * - driverId: number
 * - from: string ("Driver-{id}" or "Dispatcher" or "Broadcast")
 * - date: string (ISO date)
 * - read: boolean
 */

import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/dateHelpers';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    TextField,
    IconButton,
    Paper,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { messagesAPI, driversAPI } from '../services/apiService';
import soundService from '../services/soundService';

const DriverMessagingModal = ({
    isOpen,
    onClose,
    driverId,
    driverName: propDriverName,
    rideContext = null,  // { rideId, customerName, customerPhone }
    onNavigateToRideHistory = null  // Callback to navigate to RideHistory with a search query
}) => {
    const { user, signalRConnection } = useAuth();
    const { showAlert } = useAlert();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [firstUnreadIndex, setFirstUnreadIndex] = useState(-1);
    const [fetchedDriverName, setFetchedDriverName] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Use prop name if available, otherwise use fetched name
    const driverName = propDriverName || fetchedDriverName;

    /**
     * Fetch driver name if not provided as prop
     */
    useEffect(() => {
        const fetchDriverName = async () => {
            if (isOpen && driverId && !propDriverName) {
                try {
                    const driver = await driversAPI.getById(driverId);
                    if (driver?.name) {
                        setFetchedDriverName(driver.name);
                    }
                } catch (error) {
                    console.error('Error fetching driver name:', error);
                }
            }
        };
        fetchDriverName();
    }, [isOpen, driverId, propDriverName]);

    // Clear fetched name when modal closes or driver changes
    useEffect(() => {
        if (!isOpen) {
            setFetchedDriverName(null);
        }
    }, [isOpen]);

    /**
     * Fetch today's messages when modal opens
     */
    useEffect(() => {
        if (isOpen && driverId) {
            fetchMessages();

            // Set up SignalR listener for real-time incoming messages from this driver
            if (signalRConnection) {
                const handleReceiveMessage = async (messageData) => {
                    // Only add if it's from the driver we're chatting with
                    if (messageData.fromDriverId === driverId || messageData.driverId === driverId) {
                        const messageId = messageData.messageId || messageData.id || Date.now();
                        const newMsg = {
                            id: messageId,
                            message: messageData.message,
                            driverId: driverId,
                            from: `Driver-${driverId}`,
                            date: messageData.timestamp || messageData.date || new Date().toISOString(),
                            read: true // We're viewing it now
                        };

                        setMessages(prev => [...prev, newMsg]);
                        scrollToBottom();

                        // Mark the message as read immediately since modal is open
                        if (messageId && typeof messageId === 'number') {
                            try {
                                await signalRConnection.invoke('MarkMessagesAsRead', [messageId], 'dispatcher');
                            } catch (error) {
                                console.error('Error marking incoming message as read via SignalR:', error);
                            }
                        }
                    }
                };

                // Listen for read receipts - when driver marks our message as read
                const handleMessageMarkedAsRead = (data) => {

                    // Update the message in our local state to mark it as read
                    setMessages(prev => {
                        let foundMessage = false;
                        const updated = prev.map(msg => {
                            if (msg.id === data.messageId) {
                                foundMessage = true;
                                return { ...msg, read: true };
                            }
                            return msg;
                        });

                        return updated;
                    });
                };

                signalRConnection.on('ReceiveMessage', handleReceiveMessage);
                signalRConnection.on('MessageMarkedAsRead', handleMessageMarkedAsRead);

                return () => {
                    signalRConnection.off('ReceiveMessage', handleReceiveMessage);
                    signalRConnection.off('MessageMarkedAsRead', handleMessageMarkedAsRead);
                };
            }
        }
    }, [isOpen, driverId, signalRConnection]);

    /**
     * Scroll to bottom when messages change
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * Focus input when modal opens
     */
    useEffect(() => {
        if (isOpen) {
            // Delay to allow dialog animation to complete
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    /**
     * Fetch today's messages from the API and mark driver messages as read
     */
    const fetchMessages = async () => {
        try {
            setLoading(true);

            // Fetch today's messages for this driver
            const todaysMessages = await messagesAPI.getAllMessages(driverId);

            setMessages(todaysMessages || []);

            // Find the first unread message FROM the driver for the unread divider
            const unreadIndex = (todaysMessages || []).findIndex(
                msg => !(msg.read || msg.Read) &&
                    (msg.from || msg.From)?.toLowerCase().startsWith('driver')
            );
            setFirstUnreadIndex(unreadIndex);

            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send a message to the driver via SignalR
     */
    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (!newMessage.trim() || !driverId) return;

        let messageText = newMessage.trim();

        // If we have ride context, prepend the ride info
        if (rideContext) {
            const prefix = `Re: Ride #${rideContext.rideId} - ${rideContext.customerName || 'Customer'} (${rideContext.customerPhone || 'No phone'})\n\n`;
            messageText = prefix + messageText;
        }

        setNewMessage(''); // Clear input immediately
        setSending(true);

        try {
            // Before sending, mark any unread driver messages as read
            // (If dispatcher is replying, they obviously saw the messages)
            const unreadDriverMessages = messages.filter(msg =>
                msg.from?.toLowerCase().startsWith('driver') && !msg.read
            );

            if (unreadDriverMessages.length > 0) {
                const unreadIds = unreadDriverMessages
                    .map(msg => msg.id)
                    .filter(id => id && typeof id === 'number');

                if (unreadIds.length > 0) {
                    try {
                        await signalRConnection.invoke('MarkMessagesAsRead', unreadIds, 'dispatcher');
                        // Update local state
                        setMessages(prev => prev.map(msg =>
                            unreadIds.includes(msg.id)
                                ? { ...msg, read: true }
                                : msg
                        ));
                    } catch (error) {
                        console.error('Error marking unread messages as read:', error);
                        // Continue sending even if marking fails
                    }
                }
            }

            if (!signalRConnection) {
                throw new Error('SignalR not connected. Please refresh the page.');
            }

            // Send via SignalR using DispatcherSendsMessage socket
            // This saves to DB and notifies the driver in real-time
            const savedMessage = await signalRConnection.invoke('DispatcherSendsMessage', {
                DispatcherId: user?.userId || 0,
                DriverId: driverId,
                Message: messageText,
                RideId: rideContext?.rideId || null
            });

            // Add to local messages with the REAL database ID
            const sentMessage = {
                id: savedMessage.id || savedMessage.Id,
                message: messageText,
                driverId: driverId,
                from: 'Dispatcher',
                date: savedMessage.date || savedMessage.Date || new Date().toISOString(),
                read: false // Not yet read by driver
            };

            setMessages(prev => [...prev, sentMessage]);

            // Play sound notification for sent message
            soundService.playMessageSentSound();

        } catch (error) {
            console.error('Error sending message:', error);
            showAlert('Error', 'Failed to send message. Please try again.', [{ text: 'OK' }], 'error');
            setNewMessage(messageText); // Restore message on error
        } finally {
            setSending(false);
            // Refocus input after sending
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    /**
     * Handle Enter key to send message
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    /**
     * Determine if a message is from the dispatcher (us)
     */
    const isDispatcherMessage = (msg) => {
        if (!msg.from) return false;
        const from = msg.from.toLowerCase();
        return from.startsWith('dispatcher') || from === 'broadcast';
    };



    /**
     * Check if a message contains a clickable Cancel/Reassign pattern
     * Pattern: "Cancel Ride Request: RideId 123" or "Reassign Ride Request: RideId 123" or "Reset Pickup Request: RideId 123"
     * Returns { isClickable: boolean, rideId: string|null }
     */
    const parseClickableMessage = (message) => {
        if (!message) return { isClickable: false, rideId: null };

        // Match patterns like "Cancel Ride Request: RideId 123" or "Reassign Ride Request: RideId 123" or "Reset Pickup Request: RideId 123"
        const cancelMatch = message.match(/Cancel Ride Request:\s*RideId\s*(\d+)/i);
        const reassignMatch = message.match(/Reassign Ride Request:\s*RideId\s*(\d+)/i);
        const resetMatch = message.match(/Reset Pickup Request:\s*RideId\s*(\d+)/i);
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
     * Handle click on a clickable message
     */
    const handleMessageClick = (rideId) => {
        if (onNavigateToRideHistory && rideId) {
            //onClose(); // Close the modal first
            // Don't call onClose() here - let navigateToRideHistory handle closing the modal
            // to avoid race condition with URL updates
            onNavigateToRideHistory(rideId);
        }
    };

    /**
     * Render unread messages divider
     */
    const renderUnreadDivider = () => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                my: 2,
                gap: 1,
            }}
        >
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#f44336' }} />
            <Typography
                variant="caption"
                sx={{
                    color: '#f44336',
                    fontWeight: 'bold',
                    px: 1,
                    textTransform: 'uppercase',
                }}
            >
                Unread
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#f44336' }} />
        </Box>
    );

    /**
     * Render a single message bubble
     */
    const renderMessage = (msg, index) => {
        const isDispatcher = isDispatcherMessage(msg);
        const isBroadcast = msg.from?.toLowerCase() === 'broadcast';
        const { isClickable, rideId, type } = parseClickableMessage(msg.message);

        return (
            <Box
                key={msg.id || index}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isDispatcher ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                }}
            >
                {/* Sender label for driver messages */}
                {!isDispatcher && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#666',
                            mb: 0.5,
                            ml: 1,
                        }}
                    >
                        {driverName || `Driver #${driverId}`}
                    </Typography>
                )}

                {/* Message bubble */}
                <Paper
                    elevation={1}
                    onClick={isClickable && !isDispatcher ? () => handleMessageClick(rideId) : undefined}
                    sx={{
                        p: 1.5,
                        maxWidth: '75%',
                        borderRadius: 2,
                        backgroundColor: isDispatcher
                            ? '#128C7E' // Green for dispatcher (same as driver app)
                            : isBroadcast
                                ? '#fff3cd'
                                : isClickable
                                    ? type === 'cancel' ? '#ffebee'
                                        : type === 'resetPickup' ? '#fff3e0'
                                            : '#e3f2fd' // Light red for cancel, light orange for reset, light blue for reassign
                                    : '#fff',
                        borderBottomRightRadius: isDispatcher ? 4 : 16,
                        borderBottomLeftRadius: isDispatcher ? 16 : 4,
                        border: isBroadcast
                            ? '1px solid #ffc107'
                            : isClickable && !isDispatcher
                                ? type === 'cancel' ? '2px solid #f44336'
                                    : type === 'resetPickup' ? '2px solid #ff9800'
                                        : '2px solid #2196f3'
                                : 'none',
                        cursor: isClickable && !isDispatcher ? 'pointer' : 'default',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        '&:hover': isClickable && !isDispatcher ? {
                            transform: 'scale(1.02)',
                            boxShadow: 3,
                        } : {},
                    }}
                >
                    {/* Clickable indicator for driver messages */}
                    {isClickable && !isDispatcher && (
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
                    <Typography
                        variant="body2"
                        sx={{
                            color: isDispatcher ? '#fff' : '#333',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {msg.message}
                    </Typography>
                </Paper>

                {/* Timestamp and read status */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mx: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{ color: '#999', fontSize: '0.7rem' }}
                    >
                        {formatTime(msg.date)}
                    </Typography>
                    {/* Show read receipt for dispatcher's messages */}
                    {isDispatcher && (
                        <Typography
                            variant="caption"
                            sx={{
                                ml: 0.5,
                                color: msg.read ? '#007AFF' : '#999',
                                fontWeight: 600,
                            }}
                        >
                            {msg.read ? '✓✓' : '✓'}
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    height: '80vh',
                    maxHeight: '600px',
                    display: 'flex',
                    flexDirection: 'column',
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                }}
            >
                <Box>
                    <Typography variant="h6" component="span">
                        {driverName || `Driver #${driverId}`}
                    </Typography>
                    {rideContext && (
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                            Re: Ride #{rideContext.rideId}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Messages Container */}
            <DialogContent
                ref={messagesContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5',
                    p: 2,
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>💬</Typography>
                        <Typography variant="body1" color="text.secondary">
                            No messages today
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Send a message to start the conversation
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <React.Fragment key={msg.id || index}>
                                {index === firstUnreadIndex && renderUnreadDivider()}
                                {renderMessage(msg, index)}
                            </React.Fragment>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </DialogContent>

            {/* Message Input */}
            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: 1,
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    multiline
                    maxRows={3}
                    autoFocus
                    inputRef={inputRef}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                        }
                    }}
                />
                <IconButton
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    sx={{
                        backgroundColor: '#128C7E',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: '#0e7a6e',
                        },
                        '&:disabled': {
                            backgroundColor: '#ccc',
                            color: '#fff',
                        }
                    }}
                >
                    {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
            </Box>
        </Dialog>
    );
};

export default DriverMessagingModal;
