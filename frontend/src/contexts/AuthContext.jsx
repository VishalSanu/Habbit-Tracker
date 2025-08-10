import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to validate token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await axios.post(`${API}/auth/google`, {
        token: googleToken
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const registerWebAuthn = async (credentialData) => {
    try {
      const response = await axios.post(`${API}/auth/webauthn/register`, credentialData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'WebAuthn registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const subscribeToNotifications = async (subscription) => {
    try {
      const response = await axios.post(`${API}/notifications/subscribe`, {
        subscription
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Notification subscription failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Notification subscription failed' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    loginWithGoogle,
    registerWebAuthn,
    logout,
    subscribeToNotifications,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};