import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardMetrics from './DashboardMetrics';
import MetricListView from './MetricListView';
import DetailView from './DetailView';
import NewCallWizard from './NewCallWizard';
import NewRecurringCallWizard from './NewRecurringCallWizard';
import AdminManagement from './AdminManagement';
import Reports from './Reports';
import RideHistory from './RideHistory';
import DriverTracking from './DriverTracking';
import BroadcastMessagingModal from './BroadcastMessagingModal';
import DriverMessagingModal from './DriverMessagingModal';
import NotificationPanel from './NotificationPanel';
import ChangePasswordDialog from './ChangePasswordDialog';
import { adminAPI } from '../services/adminService';
import { messagesAPI } from '../services/apiService';
import soundService from '../services/soundService';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Badge,
  Tabs,
  Tab,
  IconButton,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Campaign as CampaignIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAlert } from '../contexts/AlertContext';

const MainDashboard = () => {
  const { user, logout, signalRConnection } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'list', 'detail', 'newCall', 'recurringCall', 'admin', 'reports', 'history'
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedMetricData, setSelectedMetricData] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { showToast } = useAlert();

  // Admin access state
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  // Broadcast modal state
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Change password dialog state
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Incoming message state - tracks unread messages from drivers
  const [unreadDriverMessages, setUnreadDriverMessages] = useState([]); // Array of { driverId, driverName, messageId, message }
  const [driversWithUnread, setDriversWithUnread] = useState(new Map()); // Map of driver IDs to unread count
  const [openMessagingDriverId, setOpenMessagingDriverId] = useState(null); // Track which driver's messaging modal is open

  // Snackbar for incoming message alerts
  const [snackbar, setSnackbar] = useState({ open: false, message: '', driverId: null, driverName: '' });

  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());

  // RideHistory search state - for navigating from clickable messages
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Track where detail view was navigated from (for proper back navigation)
  const [detailFromContext, setDetailFromContext] = useState(null); // { from: 'history', searchQuery: '' } or null

  // Sync state with URL on mount and location change
  useEffect(() => {
    const path = location.pathname;
    const search = new URLSearchParams(location.search);

    // Always check for messaging modal via query param (works on any view)
    const messagingDriverId = search.get('messagingDriverId');
    if (messagingDriverId) {
      setOpenMessagingDriverId(parseInt(messagingDriverId));
    } else {
      setOpenMessagingDriverId(null);
    }

    // Handle view routing
    if (path.includes('/new-call')) {
      setCurrentView('newCall');
    } else if (path.includes('/recurring-call')) {
      setCurrentView('recurringCall');
    } else if (path.includes('/admin')) {
      setCurrentView('admin');
    } else if (path.includes('/reports')) {
      setCurrentView('reports');
    } else if (path.includes('/history')) {
      setCurrentView('history');
    } else if (path.includes('/tracking')) {
      setCurrentView('tracking');
    } else if (path.includes('/detail')) {
      setCurrentView('detail');
      setSelectedItemType(search.get('type'));
      setSelectedItemId(search.get('id'));
    } else if (path.includes('/list')) {
      setCurrentView('list');
      setSelectedMetric(search.get('metric'));
    } else {
      setCurrentView('dashboard');
    }
  }, [location]);

  useEffect(() => {
    checkAdminAccess();
    loadUnreadMessages();

    // Set up SignalR listeners for incoming driver messages
    if (signalRConnection) {
      // Listen for messages from drivers to dispatchers
      const handleDriverMessage = async (messageData) => {
        console.log('SignalR message received:', messageData);

        // Only process messages FROM drivers (not broadcasts or dispatcher messages)
        // Check both lowercase and PascalCase since C# serializes with PascalCase
        const from = (messageData.from || messageData.From || '').toLowerCase();
        const isFromDriver = from.startsWith('driver');

        if (!isFromDriver) {
          console.log('Ignoring non-driver message:', from);
          return;
        }

        const driverId = messageData.driverId || messageData.DriverId;
        const driverName = messageData.driverName || messageData.DriverName || `Driver #${driverId}`;
        const message = messageData.message || messageData.Message;
        const messageId = messageData.id || messageData.Id;

        console.log('Processing driver message from:', driverId, 'Message text:', message);

        // If NotificationPanel OR the messaging modal for this driver is open, mark as read immediately
        const isModalOpenForDriver = openMessagingDriverId === driverId;
        if ((showNotifications || isModalOpenForDriver) && messageId) {
          try {
            await signalRConnection.invoke('MarkMessagesAsRead', [messageId], 'dispatcher');
            console.log('Marked incoming message as read via SignalR (panel/modal open for driver):', messageId);
            // Don't add to unread or increment count - panel/modal is open
            // Still play sound and show snackbar
            if (message) {
              soundService.playMessageSound(message);
            }
            const truncatedMessage = message && message.length > 50
              ? message.substring(0, 50) + '...'
              : (message || 'New message');
            setSnackbar({
              open: true,
              message: truncatedMessage,
              driverId,
              driverName
            });
            return; // Don't add to unread messages
          } catch (error) {
            console.error('Error marking incoming message as read via SignalR:', error);
            // Fall through to add as unread if marking fails
          }
        }

        // NotificationPanel is closed - add to unread messages
        // Play sound notification for incoming message
        if (message) {
          soundService.playMessageSound(message);
        } else {
          console.warn('No message text found in messageData:', messageData);
        }

        // Add to unread messages
        setUnreadDriverMessages(prev => {
          console.log('➕ Adding new message to unreadDriverMessages. Was:', prev.length);
          const updated = [...prev, {
            driverId,
            driverName,
            messageId,
            message,
            timestamp: new Date().toISOString()
          }];
          console.log('➕ Now:', updated.length, 'messages');
          return updated;
        });

        // Add driver to map with incremented count
        setDriversWithUnread(prev => {
          const newMap = new Map(prev);
          const currentCount = newMap.get(driverId) || 0;
          newMap.set(driverId, currentCount + 1);
          return newMap;
        });

        // Update notification count
        setNotificationCount(prev => prev + 1);

        // Show snackbar alert
        const truncatedMessage = message && message.length > 50
          ? message.substring(0, 50) + '...'
          : (message || 'New message');
        setSnackbar({
          open: true,
          message: truncatedMessage,
          driverId,
          driverName
        });
      };

      signalRConnection.on('ReceiveMessage', handleDriverMessage);

      // Listen for read receipts - when driver marks our message as read
      const handleMessageMarkedAsRead = (data) => {
        console.log('📬 MainDashboard received MessageMarkedAsRead event:', data);

        // data = { messageId, driverId, markedBy: 'driver', timestamp }
        const { messageId, driverId, markedBy } = data;

        // IMPORTANT: Only process if the DRIVER marked it as read
        // Don't process if we (dispatcher) marked it as read - we already handled it optimistically
        if (markedBy === 'dispatcher') {
          console.log('⏭️ Ignoring MessageMarkedAsRead - we marked it as read (already handled optimistically)');
          return;
        }

        if (driverId && messageId) {
          // Remove this specific message from unread list
          setUnreadDriverMessages(prev => {
            console.log('🔄 MessageMarkedAsRead: Updating unreadDriverMessages from', prev.length, 'messages');
            const updated = prev.filter(msg => msg.messageId !== messageId && msg.id !== messageId);
            console.log('🔄 MessageMarkedAsRead: Filtered to', updated.length, 'messages');

            // Update the badge count for this driver
            const remainingForDriver = updated.filter(msg => msg.driverId === driverId);
            setDriversWithUnread(prevMap => {
              const newMap = new Map(prevMap);
              if (remainingForDriver.length === 0) {
                // No more unread messages from this driver
                newMap.delete(driverId);
                console.log(`🔄 MessageMarkedAsRead: Removed driver ${driverId} from badge map`);
              } else {
                // Update count
                newMap.set(driverId, remainingForDriver.length);
                console.log(`🔄 MessageMarkedAsRead: Updated driver ${driverId} badge to ${remainingForDriver.length}`);
              }
              return newMap;
            });

            // Update total notification count
            setNotificationCount(updated.length);
            console.log(`🔄 MessageMarkedAsRead: Updated notificationCount to ${updated.length}`);

            return updated;
          });

          console.log(`✅ Updated badge for driver ${driverId} after message ${messageId} marked as read`);
        }
      };

      signalRConnection.on('MessageMarkedAsRead', handleMessageMarkedAsRead);

      return () => {
        signalRConnection.off('ReceiveMessage', handleDriverMessage);
        signalRConnection.off('MessageMarkedAsRead', handleMessageMarkedAsRead);
      };
    }

    // Set up polling for unread messages as fallback
    const interval = setInterval(loadUnreadMessages, 30000); // Check every 30 seconds
    return () => {
      clearInterval(interval);
    };
  }, [signalRConnection, showNotifications, openMessagingDriverId]);

  const checkAdminAccess = async () => {
    try {
      setRoleLoading(true);

      if (!user?.userId) {
        setIsAdmin(false);
        return;
      }

      const roleData = await adminAPI.user.isAdmin(user.userId);

      // The API returns { isAdmin: boolean }
      console.log('Admin role data:', roleData);
      setIsAdmin(roleData.isAdmin);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      // Fetch unread messages from drivers
      const unreadMessages = await messagesAPI.getUnread();
      const messagesArray = unreadMessages || [];

      // Update unread driver messages
      setUnreadDriverMessages(messagesArray);

      // Build map of driver IDs to unread message counts
      const unreadCountMap = new Map();
      messagesArray.forEach(msg => {
        const count = unreadCountMap.get(msg.driverId) || 0;
        unreadCountMap.set(msg.driverId, count + 1);
      });
      setDriversWithUnread(unreadCountMap);

      // Update notification count
      setNotificationCount(messagesArray.length);
    } catch (error) {
      console.error('Failed to load unread messages:', error);
    }
  };

  /**
   * Mark messages from a specific driver as read
   * Called when opening the messaging modal for that driver
   */
  const markDriverMessagesAsRead = useCallback(async (driverId) => {
    try {
      console.log('🔵 markDriverMessagesAsRead called for driver:', driverId);

      // Track that this driver's modal is open (suppresses badge)
      setOpenMessagingDriverId(driverId);

      // Get message IDs for this driver
      const messageIds = unreadDriverMessages
        .filter(msg => msg.driverId === driverId)
        .map(msg => msg.messageId || msg.id)
        .filter(id => id); // Filter out undefined/null

      console.log('📧 Found', messageIds.length, 'unread messages to mark as read:', messageIds);

      // Update local state FIRST (optimistic update)
      setUnreadDriverMessages(prev => {
        const filtered = prev.filter(msg => msg.driverId !== driverId);
        console.log('📝 Updated unreadDriverMessages, removed', prev.length - filtered.length, 'messages');
        return filtered;
      });

      setDriversWithUnread(prev => {
        const newMap = new Map(prev);
        newMap.delete(driverId);
        console.log('📝 Updated driversWithUnread, removed driver', driverId);
        return newMap;
      });

      setNotificationCount(prev => {
        const newCount = Math.max(0, prev - messageIds.length);
        console.log('📝 Updated notificationCount from', prev, 'to', newCount);
        return newCount;
      });

      // Then mark as read on server via SignalR
      if (messageIds.length > 0 && signalRConnection) {
        await signalRConnection.invoke('MarkMessagesAsRead', messageIds, 'dispatcher');
        console.log('✅ Marked messages as read via SignalR for driver:', driverId, messageIds);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [unreadDriverMessages, signalRConnection]);

  /**
   * Called when messaging modal closes
   */
  const handleMessagingModalClose = useCallback(() => {
    console.log('🔴 Messaging modal closing');
    setOpenMessagingDriverId(null);

    // Remove messagingDriverId from URL while preserving other params
    const search = new URLSearchParams(location.search);
    search.delete('messagingDriverId');
    const newSearch = search.toString();
    navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
  }, [location, navigate]);

  /**
   * Open messaging modal with URL update
   */
  const openMessagingModal = useCallback((driverId) => {
    console.log('🔵 openMessagingModal called with driverId:', driverId);
    console.log('🔵 Current view:', currentView);

    // Set state directly for immediate effect
    setOpenMessagingDriverId(driverId);

    // Also add messagingDriverId to URL while preserving other params (for refresh/reload)
    const search = new URLSearchParams(location.search);
    search.set('messagingDriverId', driverId);
    navigate(`${location.pathname}?${search.toString()}`, { replace: false });
  }, [location, navigate, currentView]);

  /**
   * Get badge counts with the currently open modal's driver suppressed
   */
  const getFilteredBadgeCounts = useCallback(() => {
    if (!openMessagingDriverId) {
      return driversWithUnread;
    }

    // Return a new Map without the currently open driver
    const filtered = new Map(driversWithUnread);
    filtered.delete(openMessagingDriverId);
    return filtered;
  }, [driversWithUnread, openMessagingDriverId]);

  /**
   * Navigate to RideHistory with a specific search query
   * Used when clicking on a "Cancel Call" or "Reassign Call" message
   */
  const navigateToRideHistory = useCallback((rideId) => {
    console.log('🔵 Navigating to ride history for rideId:', rideId);

    setHistorySearchQuery(rideId.toString());
    setCurrentView('history');
    // Close messaging modal
    setOpenMessagingDriverId(null);

    // First navigate to history
    navigate('/dashboard/history');

    // Then clean up the URL after a short delay to ensure navigation completes
    setTimeout(() => {
      const search = new URLSearchParams(window.location.search);
      search.delete('messagingDriverId');
      const searchString = search.toString();
      const cleanUrl = `/dashboard/history${searchString ? '?' + searchString : ''}`;
      console.log('🔵 Cleaning URL to:', cleanUrl);
      navigate(cleanUrl, { replace: true });
    }, 50);
  }, [navigate]);



  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMetricClick = (metricType, data) => {
    setSelectedMetric(metricType);
    setSelectedMetricData(data);
    setCurrentView('list');
    navigate(`/dashboard/list?metric=${metricType}`);
  };

  const handleItemClick = (itemType, itemId, context = null) => {
    setSelectedItemType(itemType);
    setSelectedItemId(itemId);
    setDetailFromContext(context); // Store where we came from
    setCurrentView('detail');
    navigate(`/dashboard/detail?type=${itemType}&id=${itemId}`);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedMetric(null);
    setSelectedMetricData([]);
    setSelectedItemType(null);
    setSelectedItemId(null);
    navigate('/dashboard');
  };

  const handleBackToList = () => {
    // Check if we came from history
    if (detailFromContext?.from === 'history') {
      setCurrentView('history');
      setSelectedItemType(null);
      setSelectedItemId(null);
      // Navigate back to history with the search query preserved
      const searchParam = detailFromContext.searchQuery ? `?search=${detailFromContext.searchQuery}` : '';
      navigate(`/dashboard/history${searchParam}`);
      setDetailFromContext(null);
    } else {
      setCurrentView('list');
      setSelectedItemType(null);
      setSelectedItemId(null);
      navigate(`/dashboard/list?metric=${selectedMetric}`);
    }
  };

  // const handleShowNewCall = () => {
  //   setCurrentView('newCall');
  // };

  const handleNewCallComplete = () => {
    loadUnreadMessages();
  };

  const handleNewCallCancel = () => {
    setCurrentView('dashboard');
    navigate('/dashboard');
  };

  const handleRecurringCallComplete = () => {
    loadUnreadMessages();
  };

  const handleRecurringCallCancel = () => {
    setCurrentView('dashboard');
    navigate('/dashboard');
  };

  const handleShowNotifications = () => {
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Don't refresh - SignalR events keep the state updated in real-time
  };

  const handleShowBroadcast = () => {
    setShowBroadcast(true);
  };

  const handleCloseBroadcast = () => {
    setShowBroadcast(false);
  };

  const handleShowChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
  };

  const handlePasswordChangeSuccess = () => {
    showToast('Password updated successfully!', 'success');

  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleToggleSound = () => {
    const newState = soundService.toggle();
    setSoundEnabled(newState);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'list':
        return (
          <MetricListView
            isAdmin={isAdmin}
            metricType={selectedMetric}
            data={selectedMetricData}
            onItemClick={handleItemClick}
            onBackToDashboard={handleBackToDashboard}
            driversWithUnread={getFilteredBadgeCounts()}
            onMarkMessagesRead={markDriverMessagesAsRead}
            onMessagingModalClose={handleMessagingModalClose}
            onNavigateToRideHistory={navigateToRideHistory}
            openMessagingModal={openMessagingModal}
            openMessagingDriverId={openMessagingDriverId}
          />
        );

      case 'detail':
        return (
          <DetailView
            isAdmin={isAdmin}
            itemType={selectedItemType}
            itemId={selectedItemId}
            onBackToList={handleBackToList}
          />
        );

      case 'newCall':
        return (
          <NewCallWizard
            onComplete={handleNewCallComplete}
            onCancel={handleNewCallCancel}
          />
        );

      case 'recurringCall':
        return (
          <NewRecurringCallWizard
            onComplete={handleRecurringCallComplete}
            onCancel={handleRecurringCallCancel}
          />
        );

      case 'admin':
        return <AdminManagement onNavigateToRideHistory={navigateToRideHistory} openMessagingModal={openMessagingModal} openMessagingDriverId={openMessagingDriverId} onMessagingModalClose={handleMessagingModalClose} onMarkMessagesRead={markDriverMessagesAsRead} />;

      case 'reports':
        return <Reports />;

      case 'history':
        return (
          <RideHistory
            isAdmin={isAdmin}
            onItemClick={handleItemClick}
            initialSearchQuery={historySearchQuery}
            onSearchQueryUsed={() => setHistorySearchQuery('')}
          />
        );

      case 'tracking':
        return <DriverTracking isAdmin={isAdmin} />;

      default: // 'dashboard'
        return (
          <div className="dashboard-main">
            <DashboardMetrics
              onMetricClick={handleMetricClick}
              hasUnreadMessages={driversWithUnread.size > 0}
            />
          </div>
        );
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Dispatcher Dashboard
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tabs
              value={currentView}
              onChange={(e, newValue) => {
                setCurrentView(newValue);
                if (newValue === 'dashboard') navigate('/dashboard');
                else if (newValue === 'newCall') navigate('/dashboard/new-call');
                else if (newValue === 'recurringCall') navigate('/dashboard/recurring-call');
                else if (newValue === 'admin') navigate('/dashboard/admin');
                else if (newValue === 'reports') navigate('/dashboard/reports');
                else if (newValue === 'history') navigate('/dashboard/history');
                else if (newValue === 'tracking') navigate('/dashboard/tracking');
              }}
              sx={{ minHeight: 'auto' }}
            >
              <Tab label="Dashboard" value="dashboard" />
              <Tab label="New Call" value="newCall" />
              <Tab label="Recurring Call" value="recurringCall" />
              <Tab label="History" value="history" />
              <Tab label="Tracking" value="tracking" />
              {!roleLoading && isAdmin && (
                <Tab label="Reports" value="reports" />
              )}
              {!roleLoading && isAdmin && (
                <Tab label="Admin" value="admin" />
              )}
            </Tabs>

            <IconButton
              onClick={handleShowBroadcast}
              color="primary"
              title="Broadcast to All Drivers"
            >
              <CampaignIcon />
            </IconButton>

            <Tooltip title={soundEnabled ? "Sound notifications enabled" : "Sound notifications disabled"}>
              <IconButton
                onClick={handleToggleSound}
                color={soundEnabled ? "primary" : "default"}
              >
                {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={handleShowNotifications}
              color="primary"
            >
              <Badge badgeContent={openMessagingDriverId ? unreadDriverMessages.filter(msg => msg.driverId !== openMessagingDriverId).length : notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
              Welcome, {user?.username}
            </Typography>

            <Tooltip title="Change Password">
              <IconButton
                onClick={handleShowChangePassword}
                color="primary"
              >
                <LockIcon />
              </IconButton>
            </Tooltip>

            <Button
              onClick={handleLogout}
              color="error"
              startIcon={<LogoutIcon />}
              variant="outlined"
              size="small"
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {renderContent()}
      </Container>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={handleCloseNotifications}
        unreadMessages={openMessagingDriverId ? unreadDriverMessages.filter(msg => msg.driverId !== openMessagingDriverId) : unreadDriverMessages}
        onMessageClick={openMessagingModal}
        onMarkMessagesRead={markDriverMessagesAsRead}
        onNavigateToRideHistory={navigateToRideHistory}
      />

      {/* Broadcast Messaging Modal */}
      <BroadcastMessagingModal
        isOpen={showBroadcast}
        onClose={handleCloseBroadcast}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePassword}
        onClose={handleCloseChangePassword}
        userId={user?.userId}
        onSuccess={handlePasswordChangeSuccess}
      />

      {/* Global Driver Messaging Modal - for opening from notifications/dashboard */}
      {/* Only show when openMessagingDriverId is set AND we're NOT on list or admin views (which have their own modals) */}
      {openMessagingDriverId && currentView !== 'list' && currentView !== 'admin' && (
        <DriverMessagingModal
          isOpen={true}
          onClose={handleMessagingModalClose}
          driverId={openMessagingDriverId}
          onNavigateToRideHistory={navigateToRideHistory}
        />
      )}

      {/* Incoming Message Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            New message from {snackbar.driverName}
          </Typography>
          <Typography variant="body2">
            {snackbar.message}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainDashboard;