import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import DispatcherManager from './DispatcherManager';
import DriverManager from './DriverManager';
import './AdminManagement.css';

const AdminManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dispatchers');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      
      if (!user?.userId) {
        setIsAuthorized(false);
        return;
      }
      
      const roleData = await adminAPI.user.checkRole(user.userId);
      
      // The API returns { isAdmin: boolean }
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
      <div className="admin-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('User is not authorized to access Admin Management');
    return (
      <div className="admin-management">
        <div className="unauthorized-state">
          <div className="unauthorized-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  console.log('User is authorized to access Admin Management');
  
  return (
    <div className="admin-management">
      <div className="admin-header">
        <h1>Admin Management</h1>
        <div className="user-info">
          <span>Welcome, <strong>{user?.username || 'Admin'}</strong></span>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dispatchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('dispatchers')}
        >
          Dispatchers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          Drivers & Cars
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dispatchers' && <DispatcherManager />}
        {activeTab === 'drivers' && <DriverManager />}
      </div>
    </div>
  );
};

export default AdminManagement;