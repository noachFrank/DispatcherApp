import { createContext, useContext, useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { authAPI } from '../services/apiService';

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

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const savedAuth = localStorage.getItem('dispatcherAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
      // Reinitialize SignalR for returning user
      initializeSignalR(authData.user.userId);
    }
    setLoading(false);
  }, []);

  const initializeSignalR = async (dispatcherId) => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://192.168.1.41:5062/hubs/dispatch')
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
      const userData = {
        username: data.userName || username,
        role: data.role || 'dispatcher',
        userId: data.userId || data.id,
        token: data.token,
        isAdmin: data.isAdmin || false,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber
      };

      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('dispatcherAuth', JSON.stringify({ user: userData }));

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
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local state
      await stopSignalR();
      setSignalRConnection(null);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('dispatcherAuth');
      return true;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    signalRConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};