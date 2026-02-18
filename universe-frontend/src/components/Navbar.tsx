import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Menu, MenuItem, useTheme, useMediaQuery,
  Avatar, Divider, ListItemIcon, Tooltip, Badge
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Apartment as ApartmentIcon,
  Groups as GroupsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Notifications as NotificationsMenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { useMessages } from '../contexts/MessageContext';

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount: unreadMessages } = useMessages();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
    setUserMenuAnchor(null);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Marketplace', path: '/marketplace', icon: <StoreIcon fontSize="small" /> },
    { label: 'Roommates', path: '/roommate-matching', icon: <PeopleIcon fontSize="small" /> },
    { label: 'Housing', path: '/housing', icon: <ApartmentIcon fontSize="small" /> },
    { label: 'Study Groups', path: '/study-groups', icon: <GroupsIcon fontSize="small" /> },
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 800,
              fontSize: '1.4rem',
              letterSpacing: '-0.02em',
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.2s',
            }}
          >
            UniVerse
          </Typography>
        </Box>

        {isMobile ? (
          <IconButton
            size="large"
            color="primary"
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {navItems.map(item => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                size="small"
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive(item.path) ? 'primary.main' + '12' : 'transparent',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  fontSize: '0.875rem',
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: isActive(item.path) ? 'primary.main' + '18' : 'grey.100',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Button>
            ))}

            {isAuthenticated ? (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                <Tooltip title="Messages">
                  <IconButton
                    size="small"
                    component={Link}
                    to="/messages"
                    sx={{ color: isActive('/messages') ? 'primary.main' : 'text.secondary' }}
                  >
                    <Badge badgeContent={unreadMessages} color="error" max={99}>
                      <ChatIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <NotificationBell />
                <Tooltip title={user?.username || 'Account'}>
                  <IconButton
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    size="small"
                    sx={{ ml: 0.5 }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 3,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                      }
                    }
                  }}
                >
                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {user?.username || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || ''}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem
                    component={Link}
                    to="/profile"
                    onClick={() => setUserMenuAnchor(null)}
                    sx={{ py: 1.2 }}
                  >
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    My Profile
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/profile/edit"
                    onClick={() => setUserMenuAnchor(null)}
                    sx={{ py: 1.2 }}
                  >
                    <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                    Edit Profile
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: 'error.main' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="small"
                  sx={{
                    px: 3,
                    py: 0.8,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Mobile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 3,
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
              }
            }
          }}
        >
          {navItems.map(item => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleMenuClose}
              selected={isActive(item.path)}
              sx={{ py: 1.2 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {item.label}
            </MenuItem>
          ))}
          <Divider />
          {isAuthenticated ? (
            <>
              <MenuItem component={Link} to="/messages" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                <ListItemIcon>
                  <Badge badgeContent={unreadMessages} color="error" max={99}>
                    <ChatIcon fontSize="small" />
                  </Badge>
                </ListItemIcon>
                Messages
              </MenuItem>
              <MenuItem component={Link} to="/notifications" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                <ListItemIcon><NotificationsMenuIcon fontSize="small" /></ListItemIcon>
                Notifications
              </MenuItem>
              <MenuItem component={Link} to="/profile" onClick={handleMenuClose} sx={{ py: 1.2 }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Sign Out
              </MenuItem>
            </>
          ) : (
            <MenuItem component={Link} to="/login" onClick={handleMenuClose} sx={{ py: 1.2 }}>
              <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
              Sign In
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
