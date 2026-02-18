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
import { Link, useNavigate } from 'react-router-dom';
import {
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/register/', {
        username,
        email,
        password
      });

      setLoading(false);
      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in.' }
      });
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        let errorMessage = '';
        if (errorData.username) errorMessage += `Username: ${Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username} `;
        if (errorData.email) errorMessage += `Email: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email} `;
        if (errorData.password) errorMessage += `Password: ${Array.isArray(errorData.password) ? errorData.password.join(', ') : errorData.password} `;
        if (errorData.non_field_errors) errorMessage += `${Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors}`;
        setError(errorMessage.trim() || 'Registration failed. Please try again.');
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
      <Box sx={{
        position: 'absolute', top: -100, left: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -150, right: -150, width: 500, height: 500,
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)',
              color: 'white',
              p: 5,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <Box sx={{
              position: 'absolute', bottom: -40, left: -40, width: 120, height: 120,
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
              <PersonAddIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={800}>
              Join UniVerse
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Create your account and start your journey
            </Typography>
          </Box>

          <CardContent sx={{ p: 4.5 }}>
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
                label="Username"
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
                sx={{ mb: 1 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
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
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1D4ED8 0%, #0369A1 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink
                  component={Link}
                  to="/login"
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  Already have an account? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Sign In</Box>
                </MuiLink>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegisterPage;
