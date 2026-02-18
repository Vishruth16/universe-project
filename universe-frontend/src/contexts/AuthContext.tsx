import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user?: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize token synchronously so axios header is set before any child useEffects fire
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('token') || localStorage.getItem('userToken');
    if (stored) {
      // Migrate old key if needed
      if (localStorage.getItem('userToken') && !localStorage.getItem('token')) {
        localStorage.setItem('token', stored);
        localStorage.removeItem('userToken');
      }
      axios.defaults.headers.common['Authorization'] = `Token ${stored}`;
      return stored;
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info on mount (header is already set synchronously above)
  useEffect(() => {
    if (token) {
      axios.get('/api/auth/user_info/')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('userToken');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser?: User) => {
    localStorage.setItem('token', newToken);
    localStorage.removeItem('userToken'); // Clean up old key
    axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;
    setToken(newToken);
    if (newUser) {
      setUser(newUser);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      user,
      token,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
