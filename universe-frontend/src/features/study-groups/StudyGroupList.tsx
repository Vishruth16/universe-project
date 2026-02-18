import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent,
  CardActions, Button, Chip, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress,
  Container, Alert, FormControlLabel, Checkbox, Snackbar
} from '@mui/material';
import {
  Group as GroupIcon,
  Wifi as WifiIcon,
  LocationOn as LocationIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { StudyGroup, StudyGroupFilters } from './types';
import RecommendationCarousel from '../../components/RecommendationCarousel';
import { getStudyGroupRecommendations } from '../../services/recommendations';
import { useAuth } from '../../contexts/AuthContext';

const StudyGroupList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudyGroupFilters>({
    search: '',
    subject_area: '',
    course_code: '',
    is_online: '',
    has_spots: false,
    my_groups: false,
  });
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [authSnackbar, setAuthSnackbar] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.subject_area) queryParams.append('subject_area', filters.subject_area);
      if (filters.course_code) queryParams.append('course_code', filters.course_code);
      if (filters.is_online) queryParams.append('is_online', filters.is_online);
      if (filters.has_spots) queryParams.append('has_spots', 'true');
      if (filters.my_groups) queryParams.append('my_groups', 'true');

      queryParams.append('page', page.toString());

      const response = await axios.get(`/api/study-groups/?${queryParams.toString()}`);
      const data = response.data;
      const results = data.results || data || [];
      setGroups(results);
      // Dynamic pagination: derive page size from response
      const count = data.count || results.length || 0;
      if (!data.next && page === 1) {
        setTotalPages(1);
      } else if (data.next && results.length > 0) {
        setTotalPages(Math.ceil(count / results.length));
      } else {
        setTotalPages(page);
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch study groups');
      console.error('Error fetching groups:', err);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleFilterChange = (key: keyof StudyGroupFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleJoin = async (groupId: number) => {
    if (!isAuthenticated) {
      setAuthSnackbar(true);
      return;
    }
    try {
      await axios.post(`/api/study-groups/${groupId}/join/`);
      fetchGroups();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuthSnackbar(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to join group. Please try again.');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #1E40AF 100%)',
          color: 'white',
          py: 6,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Study Groups
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            Find or create study groups to collaborate with fellow students
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* AI Recommendations */}
        <RecommendationCarousel
          title="Recommended Study Groups"
          fetchRecommendations={getStudyGroupRecommendations}
          linkPrefix="/study-groups"
          renderCard={(rec) => (
            <CardContent sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                {rec.data.name}
              </Typography>
              <Chip label={rec.data.subject_area} size="small" color="primary" sx={{ mt: 0.5 }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {rec.data.member_count}/{rec.data.max_members} members
              </Typography>
            </CardContent>
          )}
        />

        {/* Filters */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Search & Filter
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Search" variant="outlined"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Subject Area" variant="outlined"
                  value={filters.subject_area}
                  onChange={(e) => handleFilterChange('subject_area', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth label="Course Code" variant="outlined"
                  value={filters.course_code}
                  onChange={(e) => handleFilterChange('course_code', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={filters.is_online}
                    label="Format"
                    onChange={(e) => handleFilterChange('is_online', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Online</MenuItem>
                    <MenuItem value="false">In-Person</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <FormControlLabel
                    control={<Checkbox checked={filters.has_spots || false}
                      onChange={(e) => handleFilterChange('has_spots', e.target.checked)} size="small" />}
                    label="Has spots"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={filters.my_groups || false}
                      onChange={(e) => handleFilterChange('my_groups', e.target.checked)} size="small" />}
                    label="My groups"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Create Button */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/study-groups/create"
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)' }
              }}
            >
              Create Study Group
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)' }
              }}
            >
              Sign In to Create Group
            </Button>
          )}
        </Box>

        {/* Groups List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : groups.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No study groups found matching your criteria.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group) => (
              <Grid item key={group.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }} noWrap>
                      {group.name}
                    </Typography>
                    <Chip
                      label={group.subject_area}
                      size="small"
                      color="primary"
                      sx={{ mb: 1, mr: 1 }}
                    />
                    {group.course_code && (
                      <Chip label={group.course_code} size="small" sx={{ mb: 1 }} />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
                      <GroupIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {group.member_count}/{group.max_members} members
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {group.is_online ? (
                        <WifiIcon fontSize="small" sx={{ mr: 0.5, color: 'info.main' }} />
                      ) : (
                        <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {group.is_online ? 'Online' : group.meeting_location || 'TBD'}
                      </Typography>
                    </Box>

                    {group.meeting_schedule && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {group.meeting_schedule} ({group.meeting_frequency})
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                      {group.description.length > 80 ? `${group.description.substring(0, 80)}...` : group.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      component={Link}
                      to={`/study-groups/${group.id}`}
                      sx={{ borderRadius: 2, fontWeight: 'bold', minHeight: 40 }}
                    >
                      View
                    </Button>
                    {!group.is_member && !group.is_full && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => isAuthenticated ? handleJoin(group.id) : setAuthSnackbar(true)}
                        sx={{ borderRadius: 2, fontWeight: 'bold', minHeight: 40 }}
                      >
                        {isAuthenticated ? 'Join' : 'Sign In'}
                      </Button>
                    )}
                    {group.is_member && (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled
                        sx={{ borderRadius: 2, fontWeight: 'bold', minHeight: 40 }}
                      >
                        Joined
                      </Button>
                    )}
                    {group.is_full && !group.is_member && (
                      <Button
                        variant="contained"
                        color="warning"
                        fullWidth
                        disabled
                        sx={{ borderRadius: 2, fontWeight: 'bold', minHeight: 40 }}
                      >
                        Full
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={totalPages} page={page} onChange={handlePageChange}
              color="primary" size="large"
              sx={{ '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 'bold' } }}
            />
          </Box>
        )}
      </Container>

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
          Please sign in to join study groups.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudyGroupList;
