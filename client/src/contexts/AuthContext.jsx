import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Configure global axios baseURL for relative api endpoints (e.g., /api/auth/me)
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');
axios.defaults.baseURL = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL.slice(0, -4) 
  : API_BASE_URL;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        toast.error('Email and password are required');
        return { success: false, error: 'Email and password are required' };
      }

      const response = await axios.post('/api/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      const { accessToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(user);
      toast.success('Logged in successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Login failed. Please try again.';
      toast.error(errorMessage);
      console.error('Login error:', error.response?.data || error.message);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      // Validate required fields
      if (!userData.email || !userData.password || !userData.username) {
        toast.error('Email, username, and password are required');
        return { success: false, error: 'Missing required fields' };
      }

      const response = await axios.post('/api/auth/register', {
        ...userData,
        email: userData.email.trim().toLowerCase(),
      });
      
      toast.success(response.data?.message || 'Registration successful! Please check your email to verify your account.');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details ||
                          (error.response?.data?.errors && error.response.data.errors.map(e => e.msg).join(', ')) ||
                          error.message || 
                          'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Registration error:', error.response?.data || error.message);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return accessToken;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user,
    isPremium: user?.subscription?.planId === 'premium' || user?.subscription?.planId === 'pro',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


