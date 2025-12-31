import { createContext, useContext, useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { authAPI } from '../services/apiService';
import getEnvironmentConfig from '../config/environment';
import { tokenManager, setForceLogoutCallback } from '../config/apiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signalRConnection, setSignalRConnection] = useState(null);

  // Define forceLogout function
  const forceLogout = async () => {
    console.log('🔴 Force logout triggered (token invalid/expired)');
    await stopSignalR();
    setSignalRConnection(null);
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('dispatcherAuth');
    tokenManager.removeToken();
  };

  // Register forceLogout with API config on mount
  useEffect(() => {
    setForceLogoutCallback(forceLogout);
    return () => {
      setForceLogoutCallback(null);
    };
  }, []);

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const savedAuth = localStorage.getItem('dispatcherAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);

      // CRITICAL: Validate JWT token exists
      const token = localStorage.getItem('dispatch_jwt_token');
      if (!token || !authData.user?.token) {
        console.error('⚠️ Auth data exists but JWT token is missing - logging out');
        // Clear invalid auth state
        localStorage.removeItem('dispatcherAuth');
        localStorage.removeItem('dispatch_jwt_token');
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUser(authData.user);
      // Reinitialize SignalR for returning user
      initializeSignalR(authData.user.userId);
    }
    setLoading(false);
  }, []);

  const initializeSignalR = async (dispatcherId) => {
    const envConfig = getEnvironmentConfig;
    const hubUrl = envConfig.SIGNALR_HUB_URL;

    // Get JWT token from localStorage
    const token = localStorage.getItem('dispatch_jwt_token');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Error) // Only show errors
      .build();

    try {
      await connection.start();
      console.log("✅ Connected to DispatchHub");

      // Register dispatcher with the hub (ensure it's sent as string)
      await connection.invoke('RegisterDispatcher', String(dispatcherId));

      setSignalRConnection(connection);
    } catch (err) {
      console.log(err);
      console.log('%c⚠️ SignalR hub not available', 'color: orange; font-weight: bold');
      console.log('%cThe app will work in HTTP polling mode. Start the backend hub for real-time features.', 'color: gray');
      setSignalRConnection(null);
    }
  };

  const stopSignalR = async () => {
    if (signalRConnection) {
      await signalRConnection.stop();
      setSignalRConnection(null);
    }
  };

  const login = async (username, password) => {
    if (!username || !password) {
      return false;
    }

    try {

      const data = await authAPI.login('dispatcher', username, password);

      // Handle new JWT response format
      const userDetails = data.userDetails || data;
      const userData = {
        username: userDetails.userName || username,
        role: data.userType || 'dispatcher',
        userId: data.userId || userDetails.id,
        token: data.token,
        isAdmin: data.isAdmin || userDetails.isAdmin || false,
        name: data.name || userDetails.name,
        email: userDetails.email,
        phoneNumber: userDetails.phoneNumber
      };

      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('dispatcherAuth', JSON.stringify({ user: userData }));

      // CRITICAL: Store JWT token separately for API requests
      if (userData.token) {
        localStorage.setItem('dispatch_jwt_token', userData.token);
        console.log('JWT token stored for API requests');
      } else {
        console.error('⚠️ No token in login response!');
      }

      // Initialize SignalR connection after successful login
      await initializeSignalR(userData.userId);

      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.userId) {
        await authAPI.logout('dispatcher', user.userId);
      }

      // Stop SignalR connection on logout
      if (signalRConnection) {
        await stopSignalR();
      }

      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('dispatcherAuth');
      // CRITICAL: Remove JWT token
      tokenManager.removeToken();
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local state
      await stopSignalR();
      setSignalRConnection(null);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('dispatcherAuth');
      // CRITICAL: Remove JWT token even on error
      tokenManager.removeToken();
      return true;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    signalRConnection,
    forceLogout // For API interceptor to call (defined above)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};