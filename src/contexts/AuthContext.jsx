import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const savedAuth = localStorage.getItem('dispatcherAuth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    if (!username || !password) {
      return false;
    }

    try {
       console.log('Attempting login for dispatcher with username:', username);
       console.log('Request payload:', { userType: 'dispatcher', userName: username, password: '[HIDDEN]' });
      
      const data = await authAPI.login('dispatcher', username, password);
       console.log('Login successful, received data:', data);
      
      const userData = { 
        username: data.username || username, 
        role: data.role || 'dispatcher', 
        userId: data.userId || data.id,
        token: data.token // Store JWT token if your API provides one
      };
      
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('dispatcherAuth', JSON.stringify({ user: userData }));
      return true;
    } catch (error) {
      //console.error('Login failed:', error);
      
      // Temporary fallback for development/testing
      // Remove this once your API is working correctly
    //   if (username && password) {
    //     console.log('Using fallback authentication for development');
    //     const userData = { 
    //       username: username, 
    //       role: 'dispatcher', 
    //       userId: 'temp-' + Date.now()
    //     };
        
    //     setIsAuthenticated(true);
    //     setUser(userData);
    //     localStorage.setItem('dispatcherAuth', JSON.stringify({ user: userData }));
    //     return true;
    //   }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.userId) {
        await authAPI.logout('dispatcher', user.userId);
      }
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('dispatcherAuth');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local state
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};