import React, { useState } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box,
  Button, Divider, CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon,
  Groups as GroupsIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { timeAgoLong } from '../utils/dateUtils';

const typeIcons: Record<string, React.ReactElement> = {
  match_request: <PeopleIcon fontSize="small" color="primary" />,
  match_accepted: <CheckCircleIcon fontSize="small" color="success" />,
  match_rejected: <CancelIcon fontSize="small" color="error" />,
  roommate_message: <PeopleIcon fontSize="small" color="info" />,
  marketplace_message: <StoreIcon fontSize="small" color="secondary" />,
  housing_inquiry: <ApartmentIcon fontSize="small" color="info" />,
  group_message: <GroupsIcon fontSize="small" color="warning" />,
};

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    loading,
    refreshNotifications,
    markOneRead,
    markAllRead,
  } = useNotifications();

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    await refreshNotifications();
  };

  const handleClose = () => setAnchorEl(null);

  const handleClickNotification = async (notification: { id: number; is_read: boolean; link: string }) => {
    if (!notification.is_read) {
      await markOneRead(notification.id);
    }
    handleClose();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const displayedNotifications = notifications.slice(0, 10);

  return (
    <>
      <IconButton size="small" onClick={handleOpen} sx={{ color: 'text.secondary' }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxHeight: 480,
              borderRadius: 3,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : displayedNotifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          displayedNotifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleClickNotification(n)}
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: n.is_read ? 'transparent' : 'action.hover',
                whiteSpace: 'normal',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={{ mt: 0.3 }}>
                  {typeIcons[n.notification_type] || <NotificationsIcon fontSize="small" />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={n.is_read ? 400 : 600} noWrap>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {timeAgoLong(n.created_at)}
                  </Typography>
                </Box>
                {!n.is_read && (
                  <DotIcon sx={{ fontSize: 10, color: 'primary.main', mt: 0.5 }} />
                )}
              </Box>
            </MenuItem>
          ))
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/notifications');
          }}
          sx={{ justifyContent: 'center', py: 1.2 }}
        >
          <Typography variant="body2" color="primary" fontWeight={600}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;
