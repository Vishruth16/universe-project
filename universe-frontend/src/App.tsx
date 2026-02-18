import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// Auth & Notifications
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';

// Marketplace
import MarketplaceList from './features/marketplace/MarketplaceList';
import MarketplaceItemDetail from './features/marketplace/MarketplaceItemDetail';
import MarketplaceItemForm from './features/marketplace/MarketplaceItemForm';

// Roommate Matching
import RoommateList from './features/roommate-matching/RoommateList';
import RoommateDetail from './features/roommate-matching/RoommateDetail';
import RoommateProfileForm from './features/roommate-matching/RoommateProfileForm';

// Housing
import HousingList from './features/housing/HousingList';
import HousingDetail from './features/housing/HousingDetail';
import HousingForm from './features/housing/HousingForm';

// Study Groups
import StudyGroupList from './features/study-groups/StudyGroupList';
import StudyGroupDetail from './features/study-groups/StudyGroupDetail';
import StudyGroupForm from './features/study-groups/StudyGroupForm';

// Notifications & Messages
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';

// Authentication guard
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
    },
    secondary: {
      main: '#0EA5E9',
      light: '#38BDF8',
      dark: '#0284C7',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#64748B' },
    body1: { lineHeight: 1.7 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.925rem',
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <NotificationProvider>
          <MessageProvider>
          <WebSocketProvider>
          <Navbar />
          <Box sx={{ pt: 8 }}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private Routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            <Route path="/profile/edit" element={
              <PrivateRoute>
                <EditProfilePage />
              </PrivateRoute>
            } />

            {/* Marketplace Routes */}
            <Route path="/marketplace" element={<MarketplaceList />} />
            <Route path="/marketplace/:id" element={<MarketplaceItemDetail />} />
            <Route path="/marketplace/create" element={
              <PrivateRoute>
                <MarketplaceItemForm />
              </PrivateRoute>
            } />
            <Route path="/marketplace/edit/:id" element={
              <PrivateRoute>
                <MarketplaceItemForm />
              </PrivateRoute>
            } />

            {/* Roommate Matching Routes */}
            <Route path="/roommate-matching" element={<RoommateList />} />
            <Route path="/roommate-matching/:id" element={<RoommateDetail />} />
            <Route path="/roommate-matching/preferences" element={<RoommateProfileForm />} />

            {/* Housing Routes */}
            <Route path="/housing" element={<HousingList />} />
            <Route path="/housing/:id" element={<HousingDetail />} />
            <Route path="/housing/create" element={
              <PrivateRoute>
                <HousingForm />
              </PrivateRoute>
            } />
            <Route path="/housing/edit/:id" element={
              <PrivateRoute>
                <HousingForm />
              </PrivateRoute>
            } />

            {/* Study Group Routes */}
            <Route path="/study-groups" element={<StudyGroupList />} />
            <Route path="/study-groups/:id" element={<StudyGroupDetail />} />
            <Route path="/study-groups/create" element={
              <PrivateRoute>
                <StudyGroupForm />
              </PrivateRoute>
            } />
            <Route path="/study-groups/edit/:id" element={
              <PrivateRoute>
                <StudyGroupForm />
              </PrivateRoute>
            } />

            {/* Notifications & Messages */}
            <Route path="/notifications" element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            } />
            <Route path="/messages" element={
              <PrivateRoute>
                <MessagesPage />
              </PrivateRoute>
            } />

            {/* 404 Page */}
            <Route path="*" element={<div>Page not found</div>} />
            </Routes>
            <Footer />
          </Box>
        </WebSocketProvider>
        </MessageProvider>
        </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
