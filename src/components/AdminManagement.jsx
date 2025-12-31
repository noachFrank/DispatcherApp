import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Container
} from '@mui/material';
import { Lock as LockIcon, Person as PersonIcon, DirectionsCar as CarIcon, PersonOff as PersonOffIcon } from '@mui/icons-material';
import { adminAPI } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import DispatcherManager from './DispatcherManager';
import DriverManager from './DriverManager';
import FiredWorkersView from './FiredWorkersView';

const AdminManagement = ({ onNavigateToRideHistory, openMessagingModal, openMessagingDriverId, onMessagingModalClose, onMarkMessagesRead }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial tab from URL
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'drivers') return 'drivers';
    if (tab === 'fired') return 'fired';
    return 'dispatchers';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  // Sync tab with URL on location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'drivers' || tab === 'dispatchers' || tab === 'fired') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (event, newValue) => {
    const tabs = ['dispatchers', 'drivers', 'fired'];
    const tab = tabs[newValue];
    setActiveTab(tab);
    navigate(`/dashboard/admin?tab=${tab}`, { replace: true });
  };

  const checkAdminAccess = async () => {
    try {
      setLoading(true);

      if (!user?.userId) {
        setIsAuthorized(false);
        return;
      }

      const roleData = await adminAPI.user.isAdmin(user.userId);

      setIsAuthorized(roleData.isAdmin);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('loading');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Checking permissions...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <LockIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={2}>
            You don't have permission to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Contact your administrator if you believe this is an error.
          </Typography>
        </Box>
      </Container>
    );
  }


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              Admin Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome, <strong>{user?.username || 'Admin'}</strong>
            </Typography>
          </Box>

          <Tabs
            value={activeTab === 'dispatchers' ? 0 : activeTab === 'drivers' ? 1 : 2}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<PersonIcon />}
              label="Dispatchers"
              iconPosition="start"
            />
            <Tab
              icon={<CarIcon />}
              label="Drivers & Cars"
              iconPosition="start"
            />
            <Tab
              icon={<PersonOffIcon />}
              label="Fired Workers"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ mt: 3 }}>
          {activeTab === 'dispatchers' && <DispatcherManager />}
          {activeTab === 'drivers' && <DriverManager onNavigateToRideHistory={onNavigateToRideHistory} openMessagingModal={openMessagingModal} openMessagingDriverId={openMessagingDriverId} onMessagingModalClose={onMessagingModalClose} onMarkMessagesRead={onMarkMessagesRead} />}
          {activeTab === 'fired' && <FiredWorkersView />}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminManagement;