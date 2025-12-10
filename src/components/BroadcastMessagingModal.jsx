/**
 * BroadcastMessagingModal.jsx
 * 
 * A modal dialog for broadcasting messages to ALL active drivers.
 * 
 * FEATURES:
 * - Opens as a modal dialog when clicking "Broadcast" button in the header
 * - Fetches previous broadcast messages from /api/Communication/BroadcastComs
 * - Chat-style UI showing all previous broadcasts
 * - Text input at bottom with send button
 * - Messages sent via SignalR using BroadcastToAllDrivers socket
 * - Auto-scrolls to latest message
 * 
 * PROPS:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * 
 * REAL-TIME:
 * - Broadcasts are sent to all connected drivers via SignalR
 * 
 * DATA STRUCTURE (Communication from server):
 * - id: number
 * - message: string
 * - from: string ("Broadcast")
 * - date: string (ISO date)
 */

import React, { useState, useEffect, useRef } from 'react';
import { formatDateTime as formatTime } from '../utils/dateHelpers';
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
    Campaign as CampaignIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI } from '../services/apiService';

const BroadcastMessagingModal = ({
    isOpen,
    onClose,
}) => {
    const { user, signalRConnection } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    /**
     * Fetch broadcast messages when modal opens
     */
    useEffect(() => {
        if (isOpen) {
            fetchBroadcastMessages();
        }
    }, [isOpen]);

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
     * Fetch broadcast messages from the API
     */
    const fetchBroadcastMessages = async () => {
        try {
            setLoading(true);
            const broadcastMessages = await messagesAPI.getBroadcastMessages();
            console.log('Fetched broadcast messages:', broadcastMessages);
            setMessages(Array.isArray(broadcastMessages) ? broadcastMessages : []);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching broadcast messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send a broadcast message to all drivers via SignalR
     */
    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        setNewMessage(''); // Clear input immediately
        setSending(true);

        try {
            console.log('Broadcasting message to all drivers:', messageText);

            if (!signalRConnection) {
                throw new Error('SignalR not connected. Please refresh the page.');
            }

            // Send via SignalR - pass parameters separately as the hub method expects (int dispatcherId, string messageText)
            await signalRConnection.invoke('DispatcherBroadcastMessage', user?.userId || 0, messageText);

            // Add to local messages (optimistic update)
            const sentMessage = {
                id: Date.now(),
                message: messageText,
                from: 'Broadcast',
                date: new Date().toISOString(),
            };

            setMessages(prev => [...prev, sentMessage]);
            console.log('Broadcast message sent successfully');

        } catch (error) {
            console.error('Error sending broadcast:', error);
            alert('Failed to send broadcast. Please try again.');
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
     * Render a single broadcast message
     */
    const renderMessage = (msg, index) => {
        return (
            <Box
                key={msg.id || index}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 1.5,
                }}
            >
                <Paper
                    elevation={1}
                    sx={{
                        p: 1.5,
                        maxWidth: '85%',
                        bgcolor: '#e3f2fd', // Light blue for broadcasts
                        borderRadius: 2,
                        borderTopRightRadius: 0,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <CampaignIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="primary" fontWeight="bold">
                            Broadcast to All Drivers
                        </Typography>
                    </Box>
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {msg.message}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                    >
                        {formatTime(msg.date)}
                    </Typography>
                </Paper>
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
                    height: '70vh',
                    maxHeight: 600,
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#1976d2',
                    color: 'white',
                    py: 1.5
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CampaignIcon />
                    <Typography variant="h6">
                        Broadcast to All Drivers
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Messages Area */}
            <DialogContent
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress />
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary">
                            No broadcast messages yet.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Send a message to all active drivers.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ flex: 1 }}>
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </Box>
                )}
            </DialogContent>

            {/* Input Area */}
            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    bgcolor: 'white',
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Type a broadcast message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    size="small"
                    multiline
                    maxRows={3}
                    autoFocus
                    inputRef={inputRef}
                    sx={{ bgcolor: '#f5f5f5' }}
                />
                <IconButton
                    type="submit"
                    color="primary"
                    disabled={!newMessage.trim() || sending}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&:disabled': { bgcolor: 'grey.300' }
                    }}
                >
                    {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
            </Box>
        </Dialog>
    );
};

export default BroadcastMessagingModal;
