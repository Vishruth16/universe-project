import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Login as LoginIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
  message?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state && state.message) {
      setSuccessMessage(state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login/', {
        username,
        password
      });

      // Use AuthContext login - stores as 'token', sets axios header, triggers re-renders
      login(response.data.token, {
        id: response.data.user_id,
        username: response.data.username || username,
        email: response.data.email || '',
      });

      setLoading(false);
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data) {
        if (err.response.data.non_field_errors) {
          setError(Array.isArray(err.response.data.non_field_errors)
            ? err.response.data.non_field_errors.join(', ')
            : err.response.data.non_field_errors);
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          setError('Invalid username or password. Please try again.');
        }
      } else {
        setError('Unable to connect to server. Please try again later.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 50%, #0EA5E9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -150, left: -150, width: 500, height: 500,
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
              color: 'white',
              p: 5,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <Box sx={{
              position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            }} />
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 2.5,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <LoginIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
              Welcome back
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, fontSize: '1.05rem' }}>
              Sign in to your UniVerse account
            </Typography>
          </Box>

          <CardContent sx={{ p: 4.5 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }}>
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2.5,
                  py: 1.6,
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink
                  component={Link}
                  to="/register"
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                >
                  Don't have an account? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Sign Up</Box>
                </MuiLink>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
