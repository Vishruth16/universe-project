// src/services/auth.ts
import axios from 'axios';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:8000';

// Add token to all requests if available
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post('/api/token-auth/', { 
      username, 
      password 
    });
    
    const { token, user_id, username: userName, email } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Set auth header for future requests
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    
    return {
      user: {
        id: user_id,
        username: userName,
        email
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post('/api/auth/register/', { 
      username, 
      email, 
      password 
    });
    
    const { token, user_id, username: userName, email: userEmail } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Set auth header for future requests
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    
    return {
      user: {
        id: user_id,
        username: userName,
        email: userEmail
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
  
  // Remove auth header
  delete axios.defaults.headers.common['Authorization'];
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/api/auth/user_info/');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};