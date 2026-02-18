import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  CardActions, Button, Chip, CircularProgress, Slider,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Pagination, Divider, Rating, Container, Avatar, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Login as LoginIcon,
  People as PeopleIcon,
  PersonSearch as PersonSearchIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MatchProfile } from './types';
import RecommendationCarousel from '../../components/RecommendationCarousel';
import { getRoommateRecommendations } from '../../services/recommendations';
import { useAuth } from '../../contexts/AuthContext';

const RoommateList: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [minScore, setMinScore] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState({
    sleepHabits: '',
    studyHabits: '',
    smokingPreference: '',
    drinkingPreference: '',
    guestsPreference: '',
  });

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [matches, minScore, searchTerm, filters]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/roommate-matches/');
      setMatches(response.data);
      setFilteredMatches(response.data);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('profile')) {
        setNeedsProfile(true);
      } else {
        setError('Failed to fetch roommate matches');
      }
    }
  };

  const applyFilters = () => {
    let result = [...matches];

    result = result.filter(match => match.compatibility_score >= minScore);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(match =>
        `${match.profile.first_name} ${match.profile.last_name}`.toLowerCase().includes(term) ||
        (match.profile.bio && match.profile.bio.toLowerCase().includes(term)) ||
        (match.profile.interests && match.profile.interests.toLowerCase().includes(term)) ||
        (match.profile.course_major && match.profile.course_major.toLowerCase().includes(term))
      );
    }

    if (filters.sleepHabits) {
      result = result.filter(match => match.roommate_profile.sleep_habits === filters.sleepHabits);
    }
    if (filters.studyHabits) {
      result = result.filter(match => match.roommate_profile.study_habits === filters.studyHabits);
    }
    if (filters.smokingPreference) {
      result = result.filter(match => match.roommate_profile.smoking_preference === filters.smokingPreference);
    }
    if (filters.drinkingPreference) {
      result = result.filter(match => match.roommate_profile.drinking_preference === filters.drinkingPreference);
    }
    if (filters.guestsPreference) {
      result = result.filter(match => match.roommate_profile.guests_preference === filters.guestsPreference);
    }

    setFilteredMatches(result);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const sendMatchRequest = async (receiverId: number) => {
    try {
      await axios.post('/api/match-requests/', {
        receiver: receiverId,
        message: 'I would like to connect as potential roommates!',
      });
      setMatches(prev =>
        prev.map(match =>
          match.user.id === receiverId
            ? { ...match, match_status: 'pending' }
            : match
        )
      );
    } catch (err) {
      console.error('Error sending match request:', err);
    }
  };

  const cancelMatchRequest = async (matchId: number) => {
    try {
      await axios.delete(`/api/match-requests/${matchId}/`);
      fetchMatches();
    } catch (err) {
      console.error('Error canceling match request:', err);
    }
  };

  const getPageItems = () => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredMatches.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const pageItems = getPageItems();

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
            color: 'white',
            py: 6,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Find Your Perfect Roommate
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.85 }}>
              AI-powered matching based on lifestyle, habits, and preferences
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Card sx={{ textAlign: 'center', p: 5 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.light' }}>
              <PersonSearchIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Sign in to find roommates
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 380, mx: 'auto' }}>
              Create an account and complete your profile to get AI-powered roommate recommendations based on compatibility.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/login"
                startIcon={<LoginIcon />}
                sx={{
                  px: 4,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/register"
              >
                Create Account
              </Button>
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  // Needs to complete profile
  if (needsProfile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
            color: 'white',
            py: 6,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Find Your Perfect Roommate
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.85 }}>
              AI-powered matching based on lifestyle, habits, and preferences
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Card sx={{ textAlign: 'center', p: 5 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'warning.light' }}>
              <PeopleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Complete your profile first
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              To find compatible roommates, you need to complete your profile and set your roommate preferences.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/profile/edit"
                sx={{
                  px: 4,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)',
                  },
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/roommate-matching/preferences"
              >
                Set Roommate Preferences
              </Button>
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
          color: 'white',
          py: 6,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Find Your Perfect Roommate
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mx: 'auto' }}>
            AI-powered matching based on lifestyle, habits, and preferences
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* AI Recommendations */}
        <RecommendationCarousel
          title="Recommended Roommates"
          fetchRecommendations={getRoommateRecommendations}
          linkPrefix="/roommate-matching"
          renderCard={(rec) => (
            <CardContent sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {rec.data.first_name} {rec.data.last_name}
              </Typography>
              {rec.data.course_major && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {rec.data.course_major}
                </Typography>
              )}
              {rec.data.bio && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  {rec.data.bio?.substring(0, 60)}...
                </Typography>
              )}
            </CardContent>
          )}
        />

        {/* Filters Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Filters
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                    Min Compatibility: {minScore}%
                  </Typography>
                  <Slider
                    value={minScore}
                    onChange={(_, newValue) => setMinScore(newValue as number)}
                    valueLabelDisplay="auto"
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sleep Habits</InputLabel>
                  <Select value={filters.sleepHabits} label="Sleep Habits" onChange={(e) => handleFilterChange('sleepHabits', e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="early_riser">Early Riser</MenuItem>
                    <MenuItem value="night_owl">Night Owl</MenuItem>
                    <MenuItem value="average">Average</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Study Habits</InputLabel>
                  <Select value={filters.studyHabits} label="Study Habits" onChange={(e) => handleFilterChange('studyHabits', e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="in_room">In Room</MenuItem>
                    <MenuItem value="library">Library</MenuItem>
                    <MenuItem value="other_places">Other Places</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Smoking</InputLabel>
                  <Select value={filters.smokingPreference} label="Smoking" onChange={(e) => handleFilterChange('smokingPreference', e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="sometimes">Sometimes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Drinking</InputLabel>
                  <Select value={filters.drinkingPreference} label="Drinking" onChange={(e) => handleFilterChange('drinkingPreference', e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="sometimes">Sometimes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Guests</InputLabel>
                  <Select value={filters.guestsPreference} label="Guests" onChange={(e) => handleFilterChange('guestsPreference', e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="sometimes">Sometimes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Search by name, interests, or major"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Count */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          {filteredMatches.length} potential roommate{filteredMatches.length !== 1 ? 's' : ''} found
        </Typography>

        {/* Roommate Cards */}
        {filteredMatches.length === 0 ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No roommates match your criteria. Try adjusting your filters.
            </Typography>
          </Card>
        ) : (
          <>
            <Grid container spacing={3}>
              {pageItems.map((match) => (
                <Grid item key={match.user.id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={match.profile.profile_picture || '/default-profile.jpg'}
                        alt={`${match.profile.first_name} ${match.profile.last_name}`}
                        sx={{ objectFit: 'cover' }}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: '1rem' }}>
                        {match.profile.first_name} {match.profile.last_name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {match.profile.age ? `${match.profile.age} yrs` : ''}
                        {match.profile.age && match.profile.gender ? ' \u00B7 ' : ''}
                        {match.profile.gender || ''}
                      </Typography>

                      {match.profile.course_major && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {match.profile.course_major}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          Cleanliness:
                        </Typography>
                        <Rating value={match.roommate_profile.cleanliness_level} readOnly size="small" sx={{ ml: 1 }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        <Chip
                          label={match.roommate_profile.sleep_habits === 'early_riser' ? 'Early Riser' :
                            match.roommate_profile.sleep_habits === 'night_owl' ? 'Night Owl' : 'Average'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={match.roommate_profile.smoking_preference === 'yes' ? 'Smoker' :
                            match.roommate_profile.smoking_preference === 'no' ? 'Non-Smoker' : 'Occasional'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>

                      {match.profile.bio && (
                        <Typography variant="caption" color="text.secondary">
                          {match.profile.bio.substring(0, 60)}{match.profile.bio.length > 60 ? '...' : ''}
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/roommate-matching/${match.user.id}`)}
                        sx={{ flex: 1 }}
                      >
                        View
                      </Button>

                      {match.match_status === 'none' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => sendMatchRequest(match.user.id)}
                          sx={{ flex: 1 }}
                        >
                          Connect
                        </Button>
                      )}

                      {match.match_status === 'pending' && (
                        <Chip label="Pending" color="warning" size="small" />
                      )}

                      {match.match_status === 'accepted' && (
                        <Chip label="Matched" color="success" size="small" />
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default RoommateList;
