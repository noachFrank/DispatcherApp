import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardMetrics from './DashboardMetrics';
import MetricListView from './MetricListView';
import DetailView from './DetailView';
import NewCallWizard from './NewCallWizard';
import AdminManagement from './AdminManagement';
import RideHistory from './RideHistory';
import DriverTracking from './DriverTracking';
import BroadcastMessagingModal from './BroadcastMessagingModal';
import NotificationPanel from './NotificationPanel';
import { adminAPI } from '../services/adminService';
import { messagesAPI } from '../services/apiService';
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
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';

const MainDashboard = () => {
  const { user, logout, signalRConnection } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'list', 'detail', 'newCall', 'admin', 'history'
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedMetricData, setSelectedMetricData] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Admin access state
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  // Broadcast modal state
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Incoming message state - tracks unread messages from drivers
  const [unreadDriverMessages, setUnreadDriverMessages] = useState([]); // Array of { driverId, driverName, messageId, message }
  const [driversWithUnread, setDriversWithUnread] = useState(new Set()); // Set of driver IDs with unread messages

  // Snackbar for incoming message alerts
  const [snackbar, setSnackbar] = useState({ open: false, message: '', driverId: null, driverName: '' });

  // RideHistory search state - for navigating from clickable messages
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Track where detail view was navigated from (for proper back navigation)
  const [detailFromContext, setDetailFromContext] = useState(null); // { from: 'history', searchQuery: '' } or null

  // Sync state with URL on mount and location change
  useEffect(() => {
    const path = location.pathname;
    const search = new URLSearchParams(location.search);

    if (path.includes('/new-call')) {
      setCurrentView('newCall');
    } else if (path.includes('/admin')) {
      setCurrentView('admin');
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
      const handleDriverMessage = (messageData) => {
        console.log('SignalR message received:', messageData);

        // Only process messages FROM drivers (not broadcasts or dispatcher messages)
        // Check both lowercase and PascalCase since C# serializes with PascalCase
        const from = (messageData.from || messageData.From || '').toLowerCase();
        const isFromDriver = from.startsWith('driver');

        if (!isFromDriver) {
          console.log('Ignoring non-driver message:', from);
          return;
        }

        const driverId = messageData.driverId;
        const driverName = messageData.driverName || `Driver #${driverId}`;
        const message = messageData.message;
        const messageId = messageData.id;

        console.log('Processing driver message from:', driverId, message);

        // Add to unread messages
        setUnreadDriverMessages(prev => [...prev, {
          driverId,
          driverName,
          messageId,
          message,
          timestamp: new Date().toISOString()
        }]);

        // Add driver to set of drivers with unread
        setDriversWithUnread(prev => new Set([...prev, driverId]));

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

      return () => {
        signalRConnection.off('ReceiveMessage', handleDriverMessage);
      };
    }

    // Set up polling for unread messages as fallback
    const interval = setInterval(loadUnreadMessages, 30000); // Check every 30 seconds
    return () => {
      clearInterval(interval);
    };
  }, [user, signalRConnection]);

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

      // Build set of driver IDs with unread messages
      const driverIds = new Set(messagesArray.map(msg => msg.driverId));
      setDriversWithUnread(driverIds);

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
      // Get message IDs for this driver
      const messageIds = unreadDriverMessages
        .filter(msg => msg.driverId === driverId)
        .map(msg => msg.messageId || msg.id)
        .filter(id => id); // Filter out undefined/null

      if (messageIds.length > 0) {
        await messagesAPI.markAsRead(messageIds);
        console.log('Marked messages as read for driver:', driverId, messageIds);
      }

      // Update local state
      setUnreadDriverMessages(prev => prev.filter(msg => msg.driverId !== driverId));
      setDriversWithUnread(prev => {
        const newSet = new Set(prev);
        newSet.delete(driverId);
        return newSet;
      });
      setNotificationCount(prev => Math.max(0, prev - messageIds.length));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [unreadDriverMessages]);

  /**
   * Navigate to RideHistory with a specific search query
   * Used when clicking on a "Cancel Call" or "Reassign Call" message
   */
  const navigateToRideHistory = useCallback((rideId) => {
    setHistorySearchQuery(rideId.toString());
    setCurrentView('history');
    navigate('/dashboard/history');
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

  const handleShowNotifications = () => {
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Refresh unread messages when closing
    loadUnreadMessages();
  };

  const handleShowBroadcast = () => {
    setShowBroadcast(true);
  };

  const handleCloseBroadcast = () => {
    setShowBroadcast(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'list':
        return (
          <MetricListView
            metricType={selectedMetric}
            data={selectedMetricData}
            onItemClick={handleItemClick}
            onBackToDashboard={handleBackToDashboard}
            driversWithUnread={driversWithUnread}
            onMarkMessagesRead={markDriverMessagesAsRead}
            onNavigateToRideHistory={navigateToRideHistory}
          />
        );

      case 'detail':
        return (
          <DetailView
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

      case 'admin':
        return <AdminManagement onNavigateToRideHistory={navigateToRideHistory} />;

      case 'history':
        return (
          <RideHistory
            onItemClick={handleItemClick}
            initialSearchQuery={historySearchQuery}
            onSearchQueryUsed={() => setHistorySearchQuery('')}
          />
        );

      case 'tracking':
        return <DriverTracking />;

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
                else if (newValue === 'admin') navigate('/dashboard/admin');
                else if (newValue === 'history') navigate('/dashboard/history');
                else if (newValue === 'tracking') navigate('/dashboard/tracking');
              }}
              sx={{ minHeight: 'auto' }}
            >
              <Tab label="Dashboard" value="dashboard" />
              <Tab label="New Call" value="newCall" />
              <Tab label="History" value="history" />
              <Tab label="Tracking" value="tracking" />
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

            <IconButton
              onClick={handleShowNotifications}
              color="primary"
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
              Welcome, {user?.username}
            </Typography>

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
        unreadMessages={unreadDriverMessages}
      />

      {/* Broadcast Messaging Modal */}
      <BroadcastMessagingModal
        isOpen={showBroadcast}
        onClose={handleCloseBroadcast}
      />

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