import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button,
  CircularProgress, Divider,
  Container, Alert, Snackbar
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { HousingListing, HousingInquiry } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatDateShort } from '../../utils/dateUtils';
import ChatPanel, { ChatMessage } from '../../components/ChatPanel';
import { Apartment as ApartmentIcon } from '@mui/icons-material';

const HousingDetail: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { subscribe } = useWebSocket();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<HousingListing | null>(null);
  const [inquiries, setInquiries] = useState<HousingInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authSnackbar, setAuthSnackbar] = useState(false);

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  useEffect(() => {
    if (listing && user) {
      fetchInquiries();
    }
  }, [listing?.id, user?.id]);

  // Subscribe to real-time messages for this housing listing
  useEffect(() => {
    if (!id) return;
    const unsub = subscribe('new_message', (data: any) => {
      if (data.conversation_type === 'housing' && data.listing_id === parseInt(id)) {
        setInquiries((prev) => {
          if (prev.some((inq) => inq.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            sender: data.sender,
            sender_username: data.sender_username,
            message: data.content,
            timestamp: data.timestamp,
          } as HousingInquiry];
        });
      }
    });
    return unsub;
  }, [id, subscribe]);

  const fetchListingDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/housing-listings/${id}/`);
      setListing(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch listing details');
      console.error('Error fetching listing:', err);
    }
  };

  const fetchInquiries = async () => {
    if (!listing || !user) return;
    try {
      const response = await axios.get(`/api/housing-inquiries/by_listing/?listing_id=${id}&other_user_id=${listing.posted_by}`);
      setInquiries(response.data);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    }
  };

  const handleMarkUnavailable = async () => {
    if (!listing || !isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      await axios.post(`/api/housing-listings/${id}/mark_unavailable/`);
      fetchListingDetails();
    } catch (err: any) {
      if (err.response?.status === 401) setAuthSnackbar(true);
      else console.error('Error marking as unavailable:', err);
    }
  };

  const handleMarkAvailable = async () => {
    if (!listing || !isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      await axios.post(`/api/housing-listings/${id}/mark_available/`);
      fetchListingDetails();
    } catch (err: any) {
      if (err.response?.status === 401) setAuthSnackbar(true);
      else console.error('Error marking as available:', err);
    }
  };

  const handleSendChatMessage = async (content: string) => {
    if (!listing) return;
    await axios.post('/api/housing-inquiries/', {
      listing: listing.id,
      receiver: listing.posted_by,
      message: content,
    });
    fetchInquiries();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !listing) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Listing not found'}</Typography>
        <Button onClick={() => navigate('/housing')}>Back to Housing</Button>
      </Box>
    );
  }

  const isOwner = user?.id === listing.posted_by;

  const amenityChips = [
    { key: 'furnished', label: 'Furnished' },
    { key: 'pets_allowed', label: 'Pets Allowed' },
    { key: 'parking', label: 'Parking' },
    { key: 'laundry', label: 'Laundry' },
    { key: 'wifi_included', label: 'WiFi Included' },
    { key: 'ac', label: 'AC' },
    { key: 'utilities_included', label: 'Utilities Included' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button onClick={() => navigate('/housing')}>
          &larr; Back to Housing
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Images */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            {listing.images && listing.images.length > 0 ? (
              <Box sx={{ width: '100%' }}>
                <img
                  src={listing.images[0].image}
                  alt={listing.title}
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

        {/* Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">{listing.title}</Typography>
              <Chip
                label={`$${listing.rent_price}/mo`}
                color="success"
                size="medium"
                sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
              />
            </Box>

            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={listing.housing_type} />
              <Chip label={listing.lease_type} color="primary" />
              {!listing.is_available && <Chip label="Unavailable" color="error" />}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 130 }}>Address:</Typography>
                <Typography variant="body2">
                  {listing.address}, {listing.city}, {listing.state} {listing.zip_code}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Bedrooms</Typography>
                  <Typography variant="h6">{listing.bedrooms}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2">Bathrooms</Typography>
                  <Typography variant="h6">{listing.bathrooms}</Typography>
                </Grid>
                {listing.sq_ft && (
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Sq Ft</Typography>
                    <Typography variant="h6">{listing.sq_ft}</Typography>
                  </Grid>
                )}
              </Grid>

              {listing.distance_to_campus && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 130 }}>Distance:</Typography>
                  <Typography variant="body2">{listing.distance_to_campus} miles to campus</Typography>
                </Box>
              )}

              {listing.available_from && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 130 }}>Available:</Typography>
                  <Typography variant="body2">
                    {formatDateShort(listing.available_from)}
                    {listing.available_to && ` - ${formatDateShort(listing.available_to)}`}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 130 }}>Posted By:</Typography>
                <Typography variant="body2">{listing.posted_by_username}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ minWidth: 130 }}>Posted On:</Typography>
                <Typography variant="body2">{formatDateShort(listing.posted_date)}</Typography>
              </Box>
            </Box>

            {/* Amenities */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Amenities:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {amenityChips.map(({ key, label }) =>
                  (listing as any)[key] ? (
                    <Chip key={key} label={label} size="small" color="success" variant="outlined" />
                  ) : null
                )}
              </Box>
            </Box>

            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              {listing.description}
            </Typography>

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
                  Sign in to contact the landlord or manage listings.
                </Alert>
              )}

              {isAuthenticated && isOwner && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/housing/edit/${listing.id}`)}
                  >
                    Edit Listing
                  </Button>
                  {listing.is_available ? (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleMarkUnavailable}
                    >
                      Mark Unavailable
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleMarkAvailable}
                    >
                      Relist Property
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
                messages={inquiries.map((inq) => ({
                  id: inq.id,
                  sender: inq.sender,
                  sender_username: inq.sender_username || 'Unknown',
                  content: inq.message,
                  timestamp: inq.timestamp,
                })) as ChatMessage[]}
                currentUserId={user?.id || 0}
                onSend={handleSendChatMessage}
                title={`Chat with ${listing.posted_by_username}`}
                subtitle={listing.title}
                titleIcon={<ApartmentIcon fontSize="small" />}
                emptyText="Send a message to the landlord"
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
    </Container>
  );
};

export default HousingDetail;
