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
import { messagesAPI } from '../services/apiService';

const DriverMessagingModal = ({
    isOpen,
    onClose,
    driverId,
    driverName,
    rideContext = null,  // { rideId, customerName, customerPhone }
    onNavigateToRideHistory = null  // Callback to navigate to RideHistory with a search query
}) => {
    const { user, signalRConnection } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [firstUnreadIndex, setFirstUnreadIndex] = useState(-1);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    /**
     * Fetch today's messages when modal opens
     */
    useEffect(() => {
        if (isOpen && driverId) {
            fetchMessages();

            // Set up SignalR listener for real-time incoming messages from this driver
            if (signalRConnection) {
                const handleReceiveMessage = (messageData) => {
                    console.log('Message received in modal:', messageData);

                    // Only add if it's from the driver we're chatting with
                    if (messageData.fromDriverId === driverId || messageData.driverId === driverId) {
                        const newMsg = {
                            id: messageData.messageId || messageData.id || Date.now(),
                            message: messageData.message,
                            driverId: driverId,
                            from: `Driver-${driverId}`,
                            date: messageData.timestamp || messageData.date || new Date().toISOString(),
                            read: true // We're viewing it now
                        };

                        setMessages(prev => [...prev, newMsg]);
                        scrollToBottom();
                    }
                };

                signalRConnection.on('ReceiveMessage', handleReceiveMessage);

                return () => {
                    signalRConnection.off('ReceiveMessage', handleReceiveMessage);
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

            console.log('Fetched messages for driver', driverId, ':', todaysMessages);
            setMessages(todaysMessages || []);

            // Find the first unread message FROM the driver for the unread divider
            const unreadIndex = (todaysMessages || []).findIndex(
                msg => !(msg.read || msg.Read) &&
                    (msg.from || msg.From)?.toLowerCase().startsWith('driver')
            );
            setFirstUnreadIndex(unreadIndex);

            // Find unread messages FROM the driver (we want to mark them as read)
            const unreadIds = (todaysMessages || [])
                .filter(msg => !msg.read && msg.from?.toLowerCase().startsWith('driver'))
                .map(msg => msg.id);

            // Mark them as read
            if (unreadIds.length > 0) {
                try {
                    await messagesAPI.markAsRead(unreadIds);
                    console.log('Marked messages as read:', unreadIds);
                } catch (error) {
                    console.error('Error marking messages as read:', error);
                }
            }

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
            console.log('Sending message to driver', driverId, ':', messageText);
            console.log('Ride context:', rideContext);

            if (!signalRConnection) {
                throw new Error('SignalR not connected. Please refresh the page.');
            }

            // Send via SignalR using DispatcherSendsMessage socket
            // This saves to DB and notifies the driver in real-time
            await signalRConnection.invoke('DispatcherSendsMessage', {
                DispatcherId: user?.userId || 0,
                DriverId: driverId,
                Message: messageText,
                RideId: rideContext?.rideId || null
            });

            // Add to local messages (optimistic update)
            const sentMessage = {
                id: Date.now(),
                message: messageText,
                driverId: driverId,
                from: 'Dispatcher',
                date: new Date().toISOString(),
                read: false // Not yet read by driver
            };

            setMessages(prev => [...prev, sentMessage]);
            console.log('Message sent successfully to driver', driverId);

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
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
     * Pattern: "Cancel Ride Request: RideId 123" or "Reassign Ride Request: RideId 123"
     * Returns { isClickable: boolean, rideId: string|null }
     */
    const parseClickableMessage = (message) => {
        if (!message) return { isClickable: false, rideId: null };

        // Match patterns like "Cancel Ride Request: RideId 123" or "Reassign Ride Request: RideId 123"
        const cancelMatch = message.match(/Cancel Ride Request:\s*RideId\s*(\d+)/i);
        const reassignMatch = message.match(/Reassign Ride Request:\s*RideId\s*(\d+)/i);
        console.log('Parsing message for clickable patterns:', message, 'cancel: ', cancelMatch, 'reassign: ', reassignMatch);
        if (cancelMatch) {
            return { isClickable: true, rideId: cancelMatch[1], type: 'cancel' };
        }
        if (reassignMatch) {
            return { isClickable: true, rideId: reassignMatch[1], type: 'reassign' };
        }

        return { isClickable: false, rideId: null, type: null };
    };

    /**
     * Handle click on a clickable message
     */
    const handleMessageClick = (rideId) => {
        if (onNavigateToRideHistory && rideId) {
            onClose(); // Close the modal first
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
                Unread Messages
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
                                    ? type === 'cancel' ? '#ffebee' : '#fff3e0' // Light red for cancel, light orange for reassign
                                    : '#fff',
                        borderBottomRightRadius: isDispatcher ? 4 : 16,
                        borderBottomLeftRadius: isDispatcher ? 16 : 4,
                        border: isBroadcast
                            ? '1px solid #ffc107'
                            : isClickable && !isDispatcher
                                ? type === 'cancel' ? '2px solid #f44336' : '2px solid #ff9800'
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
                                color: type === 'cancel' ? '#d32f2f' : '#f57c00',
                                fontWeight: 'bold',
                                mb: 0.5,
                            }}
                        >
                            ⚠️ {type === 'cancel' ? 'CANCEL REQUEST' : 'REASSIGN REQUEST'} - Click to view ride
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
