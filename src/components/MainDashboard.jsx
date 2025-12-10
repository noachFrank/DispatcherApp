import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardMetrics from './DashboardMetrics';
import MetricListView from './MetricListView';
import DetailView from './DetailView';
import NewCallWizard from './NewCallWizard';
import AdminManagement from './AdminManagement';
import NotificationPanel from './NotificationPanel';
import { adminAPI } from '../services/adminService';
import { messageService } from '../services/messageService';
import './MainDashboard.css';

const MainDashboard = () => {
  const { user, logout } = useAuth();
  
  // Navigation state
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'list', 'detail', 'newCall', 'admin'
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedMetricData, setSelectedMetricData] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Admin access state
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    loadNotificationCount();
    
    // Set up polling for notification count
    const interval = setInterval(loadNotificationCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      setRoleLoading(true);
      
      if (!user?.userId) {
        setIsAdmin(false);
        return;
      }
      
      const roleData = await adminAPI.user.checkRole(user.userId);
      
      // The API returns { isAdmin: boolean }
      setIsAdmin(roleData.isAdmin);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    } finally {
      setRoleLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const messages = await messageService.getDispatcherMessages();
      
      // Count cancellation requests and new driver messages
      const cancellationCount = messages.filter(msg => 
        msg.message.includes('Re Call #') && 
        (msg.message.includes('Customer Canceled Ride') || msg.message.includes('Reassign Please'))
      ).length;
      
      setNotificationCount(cancellationCount);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

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
  };

  const handleItemClick = (itemType, itemId) => {
    setSelectedItemType(itemType);
    setSelectedItemId(itemId);
    setCurrentView('detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedMetric(null);
    setSelectedMetricData([]);
    setSelectedItemType(null);
    setSelectedItemId(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedItemType(null);
    setSelectedItemId(null);
  };

  const handleShowNewCall = () => {
    setCurrentView('newCall');
  };

  const handleNewCallComplete = (callData) => {
    console.log('New call created:', callData);
    // Refresh notification count as new calls may trigger driver responses
    loadNotificationCount();
    // Stay on new call page after successful submission
    // The NewCallWizard will handle showing success message and clearing the form
  };

  const handleNewCallCancel = () => {
    setCurrentView('dashboard');
  };

  const handleShowNotifications = () => {
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Refresh notification count when closing
    loadNotificationCount();
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
        return <AdminManagement />;
      
      default: // 'dashboard'
        return (
          <div className="dashboard-main">
            <DashboardMetrics onMetricClick={handleMetricClick} />
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dispatcher Dashboard</h1>
          <nav className="nav-buttons">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('newCall')} 
              className={`nav-btn ${currentView === 'newCall' ? 'active' : ''}`}
            >
              New Call
            </button>
            {!roleLoading && isAdmin && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={`nav-btn admin-btn ${currentView === 'admin' ? 'active' : ''}`}
              >
                Admin
              </button>
            )}
          </nav>
          <div className="header-actions">
            <button 
              onClick={handleShowNotifications}
              className="notification-btn"
            >
              🔔 Notifications
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            <span>Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {renderContent()}
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={handleCloseNotifications}
      />
    </div>
  );
};

export default MainDashboard;