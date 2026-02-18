// src/features/marketplace/MarketplaceList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia,
  CardActions, Button, Chip, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, CircularProgress,
  Container, Alert, FormControlLabel, Checkbox
} from '@mui/material';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MarketplaceItem, MarketplaceFilters } from './type';
import RecommendationCarousel from '../../components/RecommendationCarousel';
import { getMarketplaceRecommendations } from '../../services/recommendations';
import { useAuth } from '../../contexts/AuthContext';

const MarketplaceList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    item_type: '',
    min_price: undefined,
    max_price: undefined,
    is_sold: false,
    my_items: false,
  });
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.item_type) queryParams.append('item_type', filters.item_type);
      if (filters.min_price !== undefined) queryParams.append('min_price', filters.min_price.toString());
      if (filters.max_price !== undefined) queryParams.append('max_price', filters.max_price.toString());
      if (filters.is_sold !== undefined) queryParams.append('is_sold', filters.is_sold.toString());
      if (filters.my_items) queryParams.append('my_items', 'true');
      
      queryParams.append('page', page.toString());
      
      const response = await axios.get(`/api/marketplace-items/?${queryParams.toString()}`);
      const results = response.data.results || [];
      setItems(results);
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
      setError('Failed to fetch marketplace items');
      console.error('Error fetching items:', err);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFilterChange = (key: keyof MarketplaceFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const itemTypes = [
    { value: '', label: 'All Categories' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'books', label: 'Books' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'other', label: 'Other' },
  ];

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
            Campus Marketplace
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            Buy, sell, and trade items with fellow students in a secure, trusted marketplace
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* AI Recommendations */}
        <RecommendationCarousel
          title="Recommended Items for You"
          fetchRecommendations={getMarketplaceRecommendations}
          linkPrefix="/marketplace"
          renderCard={(rec) => (
            <CardContent sx={{ p: 2, pb: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                {rec.data.title}
              </Typography>
              <Chip label={`$${rec.data.price}`} size="small" color="primary" sx={{ mt: 0.5 }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                {rec.data.item_type} - {rec.data.condition}
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
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.item_type}
                label="Category"
                onChange={(e) => handleFilterChange('item_type', e.target.value)}
              >
                {itemTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              variant="outlined"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              variant="outlined"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.is_sold}
                label="Status"
                onChange={(e) => handleFilterChange('is_sold', e.target.value)}
              >
                <MenuItem value="false">Available</MenuItem>
                <MenuItem value="true">Sold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
              {isAuthenticated && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.my_items || false}
                        onChange={(e) => handleFilterChange('my_items', e.target.checked)}
                      />
                    }
                    label="My Items Only"
                  />
                </Grid>
              )}
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
              to="/marketplace/create"
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #1E40AF 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #1E3A8A 100%)' }
              }}
            >
              Create New Listing
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #1E40AF 100%)',
                borderRadius: 3, px: 4, py: 1.5,
                fontSize: '1.1rem', fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #1E3A8A 100%)' }
              }}
            >
              Sign In to Create Listing
            </Button>
          )}
        </Box>
      
        {/* Items List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : items.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No items found matching your criteria.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
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
                    image={item.images && item.images.length > 0 ? item.images[0].image : 'https://via.placeholder.com/300x180?text=No+Image'}
                    alt={item.title}
                    sx={{ borderRadius: '12px 12px 0 0' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }} noWrap>
                        {item.title}
                      </Typography>
                      <Chip 
                        label={`$${item.price}`}
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {item.description.length > 80 ? `${item.description.substring(0, 80)}...` : item.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={item.item_type}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                      <Chip 
                        label={item.condition}
                        size="small"
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                      Posted by: {item.seller_username}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained"
                      fullWidth
                      component={Link}
                      to={`/marketplace/${item.id}`}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      View Details
                    </Button>
                    {item.is_sold && (
                      <Chip 
                        label="Sold"
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

export default MarketplaceList;