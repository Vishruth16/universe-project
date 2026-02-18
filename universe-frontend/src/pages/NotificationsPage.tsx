import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, List, ListItemButton, ListItemIcon,
  ListItemText, Button, CircularProgress, Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon,
  Groups as GroupsIcon,
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Notification, getNotifications } from '../services/notifications';
import { useNotifications } from '../contexts/NotificationContext';
import { formatSmart } from '../utils/dateUtils';

const typeIcons: Record<string, React.ReactElement> = {
  match_request: <PeopleIcon color="primary" />,
  match_accepted: <CheckCircleIcon color="success" />,
  match_rejected: <CancelIcon color="error" />,
  roommate_message: <PeopleIcon color="info" />,
  marketplace_message: <StoreIcon color="secondary" />,
  housing_inquiry: <ApartmentIcon color="info" />,
  group_message: <GroupsIcon color="warning" />,
};

const typeLabels: Record<string, string> = {
  match_request: 'Match Request',
  match_accepted: 'Match Accepted',
  match_rejected: 'Match Declined',
  roommate_message: 'Roommate Message',
  marketplace_message: 'Marketplace',
  housing_inquiry: 'Housing',
  group_message: 'Study Group',
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();
  const { markOneRead, markAllRead } = useNotifications();

  const fetchNotifications = async (pg: number) => {
    setLoading(true);
    try {
      const data = await getNotifications(pg);
      const items = Array.isArray(data) ? data : (data.results || []);
      if (pg === 1) {
        setNotifications(items);
      } else {
        setNotifications((prev) => [...prev, ...items]);
      }
      setHasMore(data.next !== null && data.next !== undefined);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markOneRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
          borderRadius: 4,
          p: 4,
          mb: 3,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Notifications
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              When you get notifications, they'll show up here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n, index) => (
              <ListItemButton
                key={n.id}
                onClick={() => handleClick(n)}
                sx={{
                  py: 2,
                  px: 3,
                  bgcolor: n.is_read ? 'transparent' : 'action.hover',
                  borderBottom: index < notifications.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  {typeIcons[n.notification_type] || <NotificationsIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body1"
                        fontWeight={n.is_read ? 400 : 600}
                        sx={{ flex: 1 }}
                      >
                        {n.title}
                      </Typography>
                      <Chip
                        label={typeLabels[n.notification_type] || n.notification_type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '70%' }}>
                        {n.message || ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatSmart(n.created_at)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
        {hasMore && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Button onClick={handleLoadMore} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Load More'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationsPage;
