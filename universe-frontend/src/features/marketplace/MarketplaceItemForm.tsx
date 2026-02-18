// src/features/marketplace/MarketplaceItemForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, Grid, Paper, CircularProgress, Alert, FormHelperText,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { MarketplaceItem } from './type'
import { useFormik } from 'formik';
import * as yup from 'yup';

interface FormValues {
  title: string;
  description: string;
  price: string;
  item_type: string;
  condition: string;
  location: string;
  item_pickup_deadline: string;
  images: File[];
}

const validationSchema = yup.object({
  title: yup.string().required('Title is required').max(100, 'Title must be at most 100 characters'),
  description: yup.string().required('Description is required'),
  price: yup.string().required('Price is required')
    .test('is-decimal', 'Price must be a valid number', (value) => {
      if (!value) return false;
      return /^\d+(\.\d{1,2})?$/.test(value);
    }),
  item_type: yup.string().required('Category is required'),
  condition: yup.string().required('Condition is required'),
  location: yup.string().required('Location is required'),
  item_pickup_deadline: yup.string().nullable(),
});

const MarketplaceItemForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const isEditMode = !!id;
  
  const formik = useFormik<FormValues>({
    initialValues: {
      title: '',
      description: '',
      price: '',
      item_type: '',
      condition: 'good', // Default value
      location: '',
      item_pickup_deadline: '',
      images: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });
  
  useEffect(() => {
    if (isEditMode) {
      fetchItemDetails();
    }
  }, [id]);
  
  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/marketplace-items/${id}/`);
      const item: MarketplaceItem = response.data;
      
      formik.setValues({
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        item_type: item.item_type,
        condition: item.condition,
        location: item.location,
        item_pickup_deadline: item.item_pickup_deadline || '',
        images: [],
      });
      
      setExistingImages(item.images || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch item details');
      console.error('Error fetching item:', err);
    }
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setSelectedImages([...selectedImages, ...newFiles]);
    
    // Create preview URLs for the selected images
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };
  
  const handleRemoveImage = (index: number) => {
    const newSelectedImages = [...selectedImages];
    newSelectedImages.splice(index, 1);
    setSelectedImages(newSelectedImages);
    
    const newPreviewUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);
    setImagePreviewUrls(newPreviewUrls);
  };
  
  const handleRemoveExistingImage = async (imageId: number, index: number) => {
    try {
      await axios.delete(`/api/item-images/${imageId}/`);
      
      const newExistingImages = [...existingImages];
      newExistingImages.splice(index, 1);
      setExistingImages(newExistingImages);
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image');
    }
  };
  
  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('item_type', values.item_type);
      formData.append('condition', values.condition);
      formData.append('location', values.location);
      
      if (values.item_pickup_deadline) {
        formData.append('item_pickup_deadline', values.item_pickup_deadline);
      }
      
      // Append new images
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });
      
      let response;
      if (isEditMode) {
        response = await axios.patch(`/api/marketplace-items/${id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.post('/api/marketplace-items/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      setSubmitting(false);
      navigate(`/marketplace/${response.data.id}`);
    } catch (err) {
      setSubmitting(false);
      setError('Failed to save item. Please check your inputs and try again.');
      console.error('Error submitting form:', err);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const itemTypes = [
    { value: 'furniture', label: 'Furniture' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'books', label: 'Books' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'other', label: 'Other' },
  ];
  
  const conditionTypes = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Listing' : 'Create Listing'}
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="price"
                name="price"
                label="Price ($)"
                type="text"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price && Boolean(formik.errors.price)}
                helperText={formik.touched.price && formik.errors.price}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.item_type && Boolean(formik.errors.item_type)}>
                <InputLabel>Category</InputLabel>
                <Select
                  id="item_type"
                  name="item_type"
                  value={formik.values.item_type}
                  label="Category"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {itemTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
                {formik.touched.item_type && formik.errors.item_type && (
                  <FormHelperText>{formik.errors.item_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.condition && Boolean(formik.errors.condition)}>
                <InputLabel>Condition</InputLabel>
                <Select
                  id="condition"
                  name="condition"
                  value={formik.values.condition}
                  label="Condition"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {conditionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
                {formik.touched.condition && formik.errors.condition && (
                  <FormHelperText>{formik.errors.condition}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Location"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="item_pickup_deadline"
                name="item_pickup_deadline"
                label="Pickup Deadline"
                type="datetime-local"
                value={formik.values.item_pickup_deadline}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                InputLabelProps={{
                  shrink: true,
                }}
                error={formik.touched.item_pickup_deadline && Boolean(formik.errors.item_pickup_deadline)}
                helperText={formik.touched.item_pickup_deadline && formik.errors.item_pickup_deadline}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                multiline
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
            
            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Images
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                >
                  Upload Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageChange}
                  />
                </Button>
              </Box>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Images
                  </Typography>
                  <Grid container spacing={2}>
                    {existingImages.map((image, index) => (
                      <Grid item key={image.id} xs={6} sm={4} md={3}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={image.image}
                            alt={`Existing ${index}`}
                          style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                        />
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                          size="small"
                          onClick={() => handleRemoveExistingImage(image.id, index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* New Images Preview */}
            {imagePreviewUrls.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  New Images
                </Typography>
                <Grid container spacing={2}>
                  {imagePreviewUrls.map((url, index) => (
                    <Grid item key={index} xs={6} sm={4} md={3}>
                      <Box sx={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          style={{ width: '100%', height: 'auto', borderRadius: 4 }}
                        />
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/marketplace')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} />
              ) : (
                isEditMode ? 'Update Listing' : 'Create Listing'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  </Box>
);
};

export default MarketplaceItemForm;