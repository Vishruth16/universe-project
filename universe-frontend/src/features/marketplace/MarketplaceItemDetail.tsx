// src/features/marketplace/MarketplaceItemDetail.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button,
  CircularProgress, Divider, Alert, Snackbar
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MarketplaceItem, MarketplaceMessage } from './type';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatDateShort } from '../../utils/dateUtils';
import ChatPanel, { ChatMessage } from '../../components/ChatPanel';
import { Store as StoreIcon } from '@mui/icons-material';

const MarketplaceItemDetail: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { subscribe } = useWebSocket();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authSnackbar, setAuthSnackbar] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  useEffect(() => {
    if (item && user) {
      fetchMessages();
    }
  }, [item?.id, user?.id]);

  // Subscribe to real-time messages for this marketplace item
  useEffect(() => {
    if (!id) return;
    const unsub = subscribe('new_message', (data: any) => {
      if (data.conversation_type === 'marketplace' && data.item_id === parseInt(id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            sender: data.sender,
            sender_username: data.sender_username,
            content: data.content,
            timestamp: data.timestamp,
          } as MarketplaceMessage];
        });
      }
    });
    return unsub;
  }, [id, subscribe]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/marketplace-items/${id}/`);
      setItem(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch item details');
      console.error('Error fetching item:', err);
    }
  };

  const fetchMessages = async () => {
    if (!item || !user) return;
    try {
      const response = await axios.get(`/api/marketplace-messages/by_item/?item_id=${id}&other_user_id=${item.seller}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleMarkAsSold = async () => {
    if (!item || !isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      await axios.post(`/api/marketplace-items/${id}/mark_as_sold/`);
      fetchItemDetails();
    } catch (err: any) {
      if (err.response?.status === 401) setAuthSnackbar(true);
      else console.error('Error marking item as sold:', err);
    }
  };

  const handleMarkAsAvailable = async () => {
    if (!item || !isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      await axios.post(`/api/marketplace-items/${id}/mark_as_available/`);
      fetchItemDetails();
    } catch (err: any) {
      if (err.response?.status === 401) setAuthSnackbar(true);
      else console.error('Error marking item as available:', err);
    }
  };

  const handleSendChatMessage = async (content: string) => {
    if (!item) return;
    await axios.post('/api/marketplace-messages/', {
      item: item.id,
      receiver: item.seller,
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

  if (error || !item) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Item not found'}</Typography>
        <Button onClick={() => navigate('/marketplace')}>
          Back to Marketplace
        </Button>
      </Box>
    );
  }

  const isOwner = user?.id === item.seller;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button onClick={() => navigate('/marketplace')}>
          &larr; Back to Marketplace
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Item Images */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            {item.images && item.images.length > 0 ? (
              <Box sx={{ width: '100%' }}>
                <img
                  src={item.images[0].image}
                  alt={item.title}
                  style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  bgcolor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <Typography>No images available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Item Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">{item.title}</Typography>
              <Chip
                label={`$${item.price}`}
                color="primary"
                size="medium"
              />
            </Box>

            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={item.item_type} />
              <Chip label={item.condition} color="secondary" />
              {item.is_sold && (
                <Chip label="Sold" color="error" />
              )}
            </Box>

            <Typography variant="body1" paragraph>
              {item.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Location:</Typography>
                <Typography variant="body2">{item.location}</Typography>
              </Box>
              {item.item_pickup_deadline && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Pickup Deadline:</Typography>
                  <Typography variant="body2">{formatDateShort(item.item_pickup_deadline)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Posted By:</Typography>
                <Typography variant="body2">{item.seller_username}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 120 }}>Posted On:</Typography>
                <Typography variant="body2">{formatDateShort(item.posted_date)}</Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!isAuthenticated && (
                <Alert
                  severity="info"
                  sx={{ borderRadius: 2 }}
                  action={
                    <Button color="inherit" size="small" component={Link} to="/login">
                      Sign In
                    </Button>
                  }
                >
                  Sign in to contact the seller or manage listings.
                </Alert>
              )}

              {isAuthenticated && isOwner && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/marketplace/edit/${item.id}`)}
                  >
                    Edit Listing
                  </Button>
                  {item.is_sold ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleMarkAsAvailable}
                    >
                      Relist Item
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleMarkAsSold}
                    >
                      Mark as Sold
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Chat Section */}
        {isAuthenticated && !isOwner && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <ChatPanel
                messages={messages.map((msg) => ({
                  id: msg.id,
                  sender: msg.sender,
                  sender_username: msg.sender_username || (msg.sender === item.seller ? item.seller_username : 'You'),
                  content: msg.content,
                  timestamp: msg.timestamp,
                })) as ChatMessage[]}
                currentUserId={user?.id || 0}
                onSend={handleSendChatMessage}
                title={`Chat with ${item.seller_username}`}
                subtitle={item.title}
                titleIcon={<StoreIcon fontSize="small" />}
                emptyText="Send a message to the seller"
                height={400}
              />
            </Paper>
          </Grid>
        )}
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
    </Box>
  );
};

export default MarketplaceItemDetail;
