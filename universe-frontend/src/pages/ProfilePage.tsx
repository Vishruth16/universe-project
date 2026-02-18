import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Edit as EditIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Interests as InterestsIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Apartment as ApartmentIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { formatDateShort } from '../utils/dateUtils';

interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  interests: string;
  course_major: string;
  bio: string;
  profile_picture: string | null;
  date_joined: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/profiles/?current_user=true');
        // Handle both paginated and non-paginated responses
        const data = response.data;
        const results = data.results || data;
        if (Array.isArray(results) && results.length > 0) {
          setProfile(results[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again later.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.light' }}>
            <EditIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom fontWeight={700}>
            Complete Your Profile
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Set up your profile to get the most out of UniVerse.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/profile/edit"
            sx={{
              px: 5,
              background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)',
              },
            }}
          >
            Create Profile
          </Button>
        </Card>
      </Container>
    );
  }

  const initials = `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase() || 'U';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #3B82F6 100%)',
          color: 'white',
          pt: 8,
          pb: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -100, left: -100, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />
      </Box>

      <Container maxWidth="lg" sx={{ mt: -12, position: 'relative', zIndex: 1, pb: 6 }}>
        <Grid container spacing={3}>
          {/* Left Column - Profile Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', overflow: 'visible', position: 'relative' }}>
              <Box sx={{ pt: 2, pb: 3, px: 3 }}>
                <Avatar
                  src={profile.profile_picture || undefined}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mt: -8,
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    bgcolor: 'primary.main',
                  }}
                >
                  {!profile.profile_picture && initials}
                </Avatar>
                <Typography variant="h5" fontWeight={800}>
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  @{profile.user.username}
                </Typography>
                {profile.course_major && (
                  <Chip
                    icon={<SchoolIcon />}
                    label={profile.course_major}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}

                <Divider sx={{ my: 2.5 }} />

                <Stack spacing={1.5}>
                  {profile.age && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                      <Typography variant="body2" color="text.secondary">Age</Typography>
                      <Typography variant="body2" fontWeight={600}>{profile.age}</Typography>
                    </Box>
                  )}
                  {profile.gender && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                      <Typography variant="body2" color="text.secondary">Gender</Typography>
                      <Typography variant="body2" fontWeight={600}>{profile.gender}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                    <Typography variant="body2" color="text.secondary">Member since</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDateShort(profile.date_joined)}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<EditIcon />}
                  component={Link}
                  to="/profile/edit"
                  sx={{
                    mt: 3,
                    background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)',
                    },
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* About */}
              <Card>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {profile.bio || 'No bio provided yet. Edit your profile to add one!'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Interests */}
              {profile.interests && (
                <Card>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <InterestsIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6" fontWeight={700}>
                        Interests
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.interests.split(',').map((interest, idx) => (
                        <Chip
                          key={idx}
                          label={interest.trim()}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: 'primary.light',
                            color: 'primary.main',
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Roommates', icon: <PeopleIcon />, to: '/roommate-matching', color: '#2563EB' },
                      { label: 'Marketplace', icon: <StoreIcon />, to: '/marketplace', color: '#0EA5E9' },
                      { label: 'Housing', icon: <ApartmentIcon />, to: '/housing', color: '#10B981' },
                      { label: 'Study Groups', icon: <GroupsIcon />, to: '/study-groups', color: '#3B82F6' },
                    ].map(action => (
                      <Grid item xs={6} sm={3} key={action.label}>
                        <Box
                          component={Link}
                          to={action.to}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            py: 2.5,
                            px: 1,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            textDecoration: 'none',
                            color: 'text.primary',
                            transition: 'all 0.2s ease',
                            minHeight: 100,
                            '&:hover': {
                              borderColor: action.color,
                              bgcolor: action.color + '08',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            },
                          }}
                        >
                          <Box sx={{ color: action.color, display: 'flex' }}>{action.icon}</Box>
                          <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.2, textAlign: 'center' }}>
                            {action.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;
