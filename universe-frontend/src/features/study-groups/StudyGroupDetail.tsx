import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button, TextField,
  CircularProgress, List, ListItem, ListItemText, Avatar,
  Divider, Container, Alert, Snackbar
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { StudyGroup, GroupMessage } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatDateShort } from '../../utils/dateUtils';
import ChatPanel, { ChatMessage } from '../../components/ChatPanel';

const StudyGroupDetail: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { subscribe } = useWebSocket();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authSnackbar, setAuthSnackbar] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  useEffect(() => {
    if (group?.is_member) {
      fetchMessages();
    }
  }, [group?.is_member]);

  // Subscribe to real-time messages for this study group
  useEffect(() => {
    if (!id) return;
    const unsub = subscribe('new_message', (data: any) => {
      if (data.conversation_type === 'study_group' && data.group_id === parseInt(id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            sender: data.sender,
            sender_username: data.sender_username,
            content: data.content,
            timestamp: data.timestamp,
          } as GroupMessage];
        });
      }
    });
    return unsub;
  }, [id, subscribe]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/study-groups/${id}/`);
      setGroup(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch group details');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/study-groups/${id}/messages/`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      const response = await axios.post(`/api/study-groups/${id}/join/`);
      setGroup(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuthSnackbar(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to join group. Please try again.');
      }
    }
  };

  const handleLeave = async () => {
    if (!isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      const response = await axios.post(`/api/study-groups/${id}/leave/`);
      setGroup(response.data);
      setMessages([]);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuthSnackbar(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to leave group. Please try again.');
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    await axios.post(`/api/study-groups/${id}/messages/`, {
      content,
    });
    fetchMessages();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !group) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Group not found'}</Typography>
        <Button onClick={() => navigate('/study-groups')}>Back to Study Groups</Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button onClick={() => navigate('/study-groups')}>
          &larr; Back to Study Groups
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Group Info Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {group.name}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip label={group.subject_area} color="primary" sx={{ mr: 1, mb: 1 }} />
              {group.course_code && <Chip label={group.course_code} sx={{ mr: 1, mb: 1 }} />}
              <Chip
                label={group.is_online ? 'Online' : 'In-Person'}
                color={group.is_online ? 'info' : 'default'}
                sx={{ mb: 1 }}
              />
            </Box>

            <Typography variant="body1" paragraph>{group.description}</Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Members:</Typography>
              <Typography variant="body2">{group.member_count}/{group.max_members}</Typography>
            </Box>

            {group.meeting_schedule && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Schedule:</Typography>
                <Typography variant="body2">{group.meeting_schedule} ({group.meeting_frequency})</Typography>
              </Box>
            )}

            {group.meeting_location && !group.is_online && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Location:</Typography>
                <Typography variant="body2">{group.meeting_location}</Typography>
              </Box>
            )}

            {group.is_online && group.meeting_link && group.is_member && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Meeting Link:</Typography>
                <Typography variant="body2">
                  <a href={group.meeting_link} target="_blank" rel="noopener noreferrer">
                    {group.meeting_link}
                  </a>
                </Typography>
              </Box>
            )}

            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
              Created by: {group.creator_username}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Created: {formatDateShort(group.created_date)}
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!isAuthenticated ? (
                <Alert
                  severity="info"
                  sx={{ borderRadius: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      component={Link}
                      to="/login"
                    >
                      Sign In
                    </Button>
                  }
                >
                  Sign in to join this group and participate in discussions.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!group.is_member && !group.is_full && (
                    <Button variant="contained" fullWidth onClick={handleJoin}>
                      Join Group
                    </Button>
                  )}
                  {group.is_member && group.user_role !== 'admin' && (
                    <Button variant="outlined" color="error" fullWidth onClick={handleLeave}>
                      Leave Group
                    </Button>
                  )}
                  {group.user_role === 'admin' && (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/study-groups/edit/${group.id}`)}
                    >
                      Edit Group
                    </Button>
                  )}
                  {group.is_full && !group.is_member && (
                    <Chip label="Group is Full" color="warning" />
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Members List */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Members ({group.member_count})
            </Typography>
            <List dense>
              {group.members.filter(m => m.is_active).map((member) => (
                <ListItem key={member.id}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: member.role === 'admin' ? 'primary.main' : 'grey.400' }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                  <ListItemText
                    primary={member.username}
                    secondary={member.role === 'admin' ? 'Admin' : 'Member'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, borderRadius: 3, height: '100%', overflow: 'hidden' }}>
            {!isAuthenticated ? (
              <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3 }}>
                <LoginIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography color="text.secondary" textAlign="center">
                  Sign in to join this group and participate in the chat.
                </Typography>
                <Button variant="contained" component={Link} to="/login" size="small">
                  Sign In
                </Button>
              </Box>
            ) : !group.is_member ? (
              <Box sx={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">
                  Join the group to participate in the chat.
                </Typography>
              </Box>
            ) : (
              <ChatPanel
                messages={messages.map((msg) => ({
                  id: msg.id,
                  sender: msg.sender,
                  sender_username: msg.sender_username,
                  content: msg.content,
                  timestamp: msg.timestamp,
                })) as ChatMessage[]}
                currentUserId={user?.id || 0}
                onSend={handleSendMessage}
                title="Group Chat"
                subtitle={`${group.member_count} members`}
                titleIcon={<GroupIcon fontSize="small" />}
                emptyText="No messages yet. Start the conversation!"
                height={500}
                showSenderName
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      {/* Auth Required Snackbar */}
      <Snackbar
        open={authSnackbar}
        autoHideDuration={6000}
        onClose={() => setAuthSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAuthSnackbar(false)}
          severity="warning"
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          }
        >
          Please sign in to perform this action.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudyGroupDetail;
