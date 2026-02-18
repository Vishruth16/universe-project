import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardMedia,
  CardActions, Button, Chip, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress,
  Container, Alert, FormControlLabel, Checkbox
} from '@mui/material';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { HousingListing, HousingFilters } from './types';
import RecommendationCarousel from '../../components/RecommendationCarousel';
import { getHousingRecommendations } from '../../services/recommendations';
import { useAuth } from '../../contexts/AuthContext';

const HousingList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HousingFilters>({
    search: '',
    housing_type: '',
    min_price: undefined,
    max_price: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    max_distance: undefined,
    furnished: false,
    pets_allowed: false,
    parking: false,
    is_available: true,
    my_listings: false,
  });
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.housing_type) queryParams.append('housing_type', filters.housing_type);
      if (filters.min_price !== undefined) queryParams.append('min_price', filters.min_price.toString());
      if (filters.max_price !== undefined) queryParams.append('max_price', filters.max_price.toString());
      if (filters.bedrooms !== undefined) queryParams.append('bedrooms', filters.bedrooms.toString());
      if (filters.bathrooms !== undefined) queryParams.append('bathrooms', filters.bathrooms.toString());
      if (filters.max_distance !== undefined) queryParams.append('max_distance', filters.max_distance.toString());
      if (filters.furnished) queryParams.append('furnished', 'true');
      if (filters.pets_allowed) queryParams.append('pets_allowed', 'true');
      if (filters.parking) queryParams.append('parking', 'true');
      if (filters.is_available !== undefined) queryParams.append('is_available', filters.is_available.toString());
      if (filters.my_listings) queryParams.append('my_listings', 'true');

      queryParams.append('page', page.toString());

      const response = await axios.get(`/api/housing-listings/?${queryParams.toString()}`);
      const results = response.data.results || [];
      setListings(results);
      // Dynamic pagination: derive page size from response
      const count = response.data.count || 0;
      if (!response.data.next && page === 1) {
        setTotalPages(1);
      } else if (response.data.next && results.length > 0) {
        setTotalPages(Math.ceil(count / results.length));
      } else {
        setTotalPages(page);
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch housing listings');
      console.error('Error fetching listings:', err);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleFilterChange = (key: keyof HousingFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const housingTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'room', label: 'Room' },
    { value: 'shared_room', label: 'Shared Room' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
          color: 'white',
          py: 6,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Campus Housing
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            Find your perfect home near campus with AI-powered recommendations
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* AI Recommendations */}
        <RecommendationCarousel
          title="Recommended Housing"
          fetchRecommendations={getHousingRecommendations}
          linkPrefix="/housing"
          renderCard={(rec) => (
            <CardContent sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                {rec.data.title}
              </Typography>
              <Chip label={`$${rec.data.rent_price}/mo`} size="small" color="success" sx={{ mt: 0.5 }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {rec.data.bedrooms} bed, {rec.data.bathrooms} bath - {rec.data.city}
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Search"
                  variant="outlined"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.housing_type}
                    label="Type"
                    onChange={(e) => handleFilterChange('housing_type', e.target.value)}
                  >
                    {housingTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  label="Min Rent"
                  type="number"
                  variant="outlined"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  label="Max Rent"
                  type="number"
                  variant="outlined"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Grid>
              <Grid item xs={6} sm={1}>
                <TextField
                  fullWidth
                  label="Beds"
                  type="number"
                  variant="outlined"
                  value={filters.bedrooms || ''}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Grid>
              <Grid item xs={6} sm={1}>
                <TextField
                  fullWidth
                  label="Baths"
                  type="number"
                  variant="outlined"
                  value={filters.bathrooms || ''}
                  onChange={(e) => handleFilterChange('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={filters.furnished || false} onChange={(e) => handleFilterChange('furnished', e.target.checked)} />}
                    label="Furnished"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={filters.pets_allowed || false} onChange={(e) => handleFilterChange('pets_allowed', e.target.checked)} />}
                    label="Pets Allowed"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={filters.parking || false} onChange={(e) => handleFilterChange('parking', e.target.checked)} />}
                    label="Parking"
                  />
                  {isAuthenticated && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.my_listings || false}
                          onChange={(e) => handleFilterChange('my_listings', e.target.checked)}
                        />
                      }
                      label="My Listings Only"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Create Listing Button */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/housing/create"
              sx={{
                background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #388e3c 0%, #1a4d1a 100%)' }
              }}
            >
              Post Housing Listing
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #388e3c 0%, #1a4d1a 100%)' }
              }}
            >
              Sign In to Post Listing
            </Button>
          )}
        </Box>

        {/* Listings */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : listings.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No housing listings found matching your criteria.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {listings.map((listing) => (
              <Grid item key={listing.id} xs={12} sm={6} md={4} lg={3}>
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
                  <CardMedia
                    component="img"
                    height="180"
                    image={listing.images && listing.images.length > 0 ? listing.images[0].image : 'https://via.placeholder.com/300x180?text=No+Image'}
                    alt={listing.title}
                    sx={{ borderRadius: '12px 12px 0 0' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }} noWrap>
                        {listing.title}
                      </Typography>
                      <Chip
                        label={`$${listing.rent_price}/mo`}
                        color="success"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {listing.address}, {listing.city}, {listing.state}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip label={listing.housing_type} size="small" sx={{ mr: 1, mb: 0.5 }} />
                      <Chip label={`${listing.bedrooms} bed`} size="small" sx={{ mr: 1, mb: 0.5 }} />
                      <Chip label={`${listing.bathrooms} bath`} size="small" sx={{ mb: 0.5 }} />
                    </Box>
                    {listing.distance_to_campus && (
                      <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                        {listing.distance_to_campus} miles from campus
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                      Posted by: {listing.posted_by_username}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      component={Link}
                      to={`/housing/${listing.id}`}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 'bold',
                        bgcolor: 'success.main',
                        '&:hover': { bgcolor: 'success.dark' }
                      }}
                    >
                      View Details
                    </Button>
                    {!listing.is_available && (
                      <Chip
                        label="Unavailable"
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 'bold'
                        }}
                      />
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
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 'bold'
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HousingList;
