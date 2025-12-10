import React, { useState, useEffect, useRef } from 'react';
import { messageService } from '../services/messageService';
import './MessagingModal.css';

const MessagingModal = ({ 
  isOpen, 
  onClose, 
  driverId, 
  driverName, 
  callId = null,
  callIdForPrefix = null 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showingFullHistory, setShowingFullHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && driverId) {
      loadTodaysMessages();
      markMessagesAsRead();
      // Set up polling for new messages
      const interval = setInterval(loadTodaysMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, driverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Handle click outside modal to close
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTodaysMessages = async () => {
    try {
      setLoading(true);
      const communications = await messageService.getDriverMessages(driverId, true);
      setMessages(communications || []);
      setShowingFullHistory(false);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullHistory = async () => {
    try {
      setLoadingHistory(true);
      const communications = await messageService.getDriverMessageHistory(driverId);
      setMessages(communications || []);
      setShowingFullHistory(true);
    } catch (error) {
      console.error('Failed to load message history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      // Get unread messages for this driver and mark them as read
      const communications = await messageService.getDriverMessages(driverId, false);
      const unreadIds = communications
        .filter(comm => !comm.read && comm.from === 'driver')
        .map(comm => comm.id);
      
      if (unreadIds.length > 0) {
        await messageService.markMessagesAsRead(unreadIds);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      let messageToSend = newMessage.trim();
      
      // Add call prefix if specified
      if (callIdForPrefix) {
        messageToSend = `Re Call #${callIdForPrefix} \n${messageToSend}`;
      }

      await messageService.sendMessageToDriver(driverId, messageToSend, callId);
      setNewMessage('');
      // Refresh messages - load today's if not showing full history
      if (showingFullHistory) {
        await loadFullHistory();
      } else {
        await loadTodaysMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const sortedMessages = messages.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!isOpen) return null;

  return (
    <div className="messaging-modal-overlay">
      <div className="messaging-modal" ref={modalRef}>
        <div className="messaging-header">
          <div className="messaging-title">
            <h3>Messages with {driverName || `Driver #${driverId}`}</h3>
            {callIdForPrefix && (
              <span className="call-context">Call #{callIdForPrefix}</span>
            )}
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="messages-container">
          {loading && messages.length === 0 ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <>
              {!showingFullHistory && (
                <div className="message-history-controls">
                  <button 
                    onClick={loadFullHistory}
                    disabled={loadingHistory}
                    className="load-more-btn"
                  >
                    {loadingHistory ? 'Loading...' : '📚 Load Full Message History'}
                  </button>
                  <div className="today-indicator">
                    📅 Today's Messages
                  </div>
                </div>
              )}
              
              <div className="messages-list">
                {sortedMessages.map((communication, index) => (
                  <div 
                    key={communication.id || index} 
                    className={`message ${communication.from === 'dispatcher' ? 'dispatcher' : 'driver'} ${!communication.read ? 'unread' : ''}`}
                  >
                    <div className="message-content">
                      <div className="message-text">{communication.message}</div>
                      <div className="message-meta">
                        <span className="message-sender">
                          {communication.from === 'dispatcher' ? 'Dispatcher' : driverName || `Driver #${driverId}`}
                        </span>
                        <span className="message-time">
                          {formatMessageTime(communication.date)}
                        </span>
                        {!communication.read && communication.from === 'driver' && (
                          <span className="unread-indicator">•</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {showingFullHistory && (
                <div className="history-info">
                  <button 
                    onClick={loadTodaysMessages}
                    className="back-to-today-btn"
                  >
                    🔄 Back to Today's Messages
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="message-input-container">
          {callIdForPrefix && (
            <div className="call-prefix-notice">
              <span>📞 Messages will be prefixed with "Re Call #{callIdForPrefix}"</span>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-row">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="message-input"
                rows="2"
                disabled={sending}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagingModal;