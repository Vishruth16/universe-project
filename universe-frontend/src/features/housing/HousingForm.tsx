import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, Grid, Paper, CircularProgress, Alert, FormHelperText,
  IconButton, FormControlLabel, Checkbox, Container
} from '@mui/material';
import { Delete as DeleteIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { HousingListing } from './types';
import { useFormik } from 'formik';
import * as yup from 'yup';

interface FormValues {
  title: string;
  description: string;
  housing_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  distance_to_campus: string;
  rent_price: string;
  bedrooms: string;
  bathrooms: string;
  sq_ft: string;
  lease_type: string;
  available_from: string;
  available_to: string;
  furnished: boolean;
  pets_allowed: boolean;
  parking: boolean;
  laundry: boolean;
  wifi_included: boolean;
  ac: boolean;
  utilities_included: boolean;
  amenities: string;
}

const validationSchema = yup.object({
  title: yup.string().required('Title is required').max(200),
  description: yup.string().required('Description is required'),
  housing_type: yup.string().required('Housing type is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  zip_code: yup.string().required('Zip code is required'),
  rent_price: yup.string().required('Rent price is required')
    .test('is-decimal', 'Must be a valid number', (value) => {
      if (!value) return false;
      return /^\d+(\.\d{1,2})?$/.test(value);
    }),
  bedrooms: yup.string().required('Bedrooms is required'),
  bathrooms: yup.string().required('Bathrooms is required'),
  lease_type: yup.string().required('Lease type is required'),
});

const HousingForm: React.FC = () => {
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
      housing_type: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      distance_to_campus: '',
      rent_price: '',
      bedrooms: '1',
      bathrooms: '1',
      sq_ft: '',
      lease_type: 'yearly',
      available_from: '',
      available_to: '',
      furnished: false,
      pets_allowed: false,
      parking: false,
      laundry: false,
      wifi_included: false,
      ac: false,
      utilities_included: false,
      amenities: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchListingDetails();
    }
  }, [id]);

  const fetchListingDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/housing-listings/${id}/`);
      const listing: HousingListing = response.data;
      formik.setValues({
        title: listing.title,
        description: listing.description,
        housing_type: listing.housing_type,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zip_code: listing.zip_code,
        distance_to_campus: listing.distance_to_campus?.toString() || '',
        rent_price: listing.rent_price.toString(),
        bedrooms: listing.bedrooms.toString(),
        bathrooms: listing.bathrooms.toString(),
        sq_ft: listing.sq_ft?.toString() || '',
        lease_type: listing.lease_type,
        available_from: listing.available_from || '',
        available_to: listing.available_to || '',
        furnished: listing.furnished,
        pets_allowed: listing.pets_allowed,
        parking: listing.parking,
        laundry: listing.laundry,
        wifi_included: listing.wifi_included,
        ac: listing.ac,
        utilities_included: listing.utilities_included,
        amenities: listing.amenities,
      });
      setExistingImages(listing.images || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch listing details');
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedImages([...selectedImages, ...newFiles]);
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

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('housing_type', values.housing_type);
      formData.append('address', values.address);
      formData.append('city', values.city);
      formData.append('state', values.state);
      formData.append('zip_code', values.zip_code);
      formData.append('rent_price', values.rent_price);
      formData.append('bedrooms', values.bedrooms);
      formData.append('bathrooms', values.bathrooms);
      formData.append('lease_type', values.lease_type);
      formData.append('furnished', String(values.furnished));
      formData.append('pets_allowed', String(values.pets_allowed));
      formData.append('parking', String(values.parking));
      formData.append('laundry', String(values.laundry));
      formData.append('wifi_included', String(values.wifi_included));
      formData.append('ac', String(values.ac));
      formData.append('utilities_included', String(values.utilities_included));

      if (values.distance_to_campus) formData.append('distance_to_campus', values.distance_to_campus);
      if (values.sq_ft) formData.append('sq_ft', values.sq_ft);
      if (values.available_from) formData.append('available_from', values.available_from);
      if (values.available_to) formData.append('available_to', values.available_to);
      if (values.amenities) formData.append('amenities', values.amenities);

      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      let response;
      if (isEditMode) {
        response = await axios.patch(`/api/housing-listings/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axios.post('/api/housing-listings/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSubmitting(false);
      navigate(`/housing/${response.data.id}`);
    } catch (err) {
      setSubmitting(false);
      setError('Failed to save listing. Please check your inputs and try again.');
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

  const housingTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'room', label: 'Room' },
    { value: 'shared_room', label: 'Shared Room' },
  ];

  const leaseTypes = [
    { value: 'yearly', label: 'Yearly' },
    { value: 'semester', label: 'Semester' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'sublease', label: 'Sublease' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Housing Listing' : 'Post Housing Listing'}
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth id="title" name="title" label="Title"
                value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.housing_type && Boolean(formik.errors.housing_type)}>
                <InputLabel>Housing Type</InputLabel>
                <Select name="housing_type" value={formik.values.housing_type} label="Housing Type"
                  onChange={formik.handleChange} onBlur={formik.handleBlur}>
                  {housingTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
                {formik.touched.housing_type && formik.errors.housing_type && (
                  <FormHelperText>{formik.errors.housing_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="rent_price" label="Monthly Rent ($)"
                value={formik.values.rent_price} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.rent_price && Boolean(formik.errors.rent_price)}
                helperText={formik.touched.rent_price && formik.errors.rent_price}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth name="address" label="Address"
                value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth name="city" label="City"
                value={formik.values.city} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.city && Boolean(formik.errors.city)}
                helperText={formik.touched.city && formik.errors.city}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth name="state" label="State"
                value={formik.values.state} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.state && Boolean(formik.errors.state)}
                helperText={formik.touched.state && formik.errors.state}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth name="zip_code" label="Zip Code"
                value={formik.values.zip_code} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.zip_code && Boolean(formik.errors.zip_code)}
                helperText={formik.touched.zip_code && formik.errors.zip_code}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="bedrooms" label="Bedrooms" type="number"
                value={formik.values.bedrooms} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.bedrooms && Boolean(formik.errors.bedrooms)}
                helperText={formik.touched.bedrooms && formik.errors.bedrooms}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="bathrooms" label="Bathrooms" type="number"
                value={formik.values.bathrooms} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.bathrooms && Boolean(formik.errors.bathrooms)}
                helperText={formik.touched.bathrooms && formik.errors.bathrooms}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="sq_ft" label="Sq Ft" type="number"
                value={formik.values.sq_ft} onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="distance_to_campus" label="Miles to Campus" type="number"
                value={formik.values.distance_to_campus} onChange={formik.handleChange}
                inputProps={{ step: '0.1' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.lease_type && Boolean(formik.errors.lease_type)}>
                <InputLabel>Lease Type</InputLabel>
                <Select name="lease_type" value={formik.values.lease_type} label="Lease Type"
                  onChange={formik.handleChange} onBlur={formik.handleBlur}>
                  {leaseTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="available_from" label="Available From" type="date"
                value={formik.values.available_from} onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth name="available_to" label="Available To" type="date"
                value={formik.values.available_to} onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Amenities Checkboxes */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Amenities</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { name: 'furnished', label: 'Furnished' },
                  { name: 'pets_allowed', label: 'Pets Allowed' },
                  { name: 'parking', label: 'Parking' },
                  { name: 'laundry', label: 'Laundry' },
                  { name: 'wifi_included', label: 'WiFi Included' },
                  { name: 'ac', label: 'AC' },
                  { name: 'utilities_included', label: 'Utilities Included' },
                ].map(({ name, label }) => (
                  <FormControlLabel
                    key={name}
                    control={
                      <Checkbox
                        name={name}
                        checked={(formik.values as any)[name]}
                        onChange={formik.handleChange}
                      />
                    }
                    label={label}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth name="amenities" label="Additional Amenities"
                multiline rows={2}
                value={formik.values.amenities} onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth name="description" label="Description" multiline rows={4}
                value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Images</Typography>
              <Box sx={{ mb: 2 }}>
                <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
                  Upload Images
                  <input type="file" accept="image/*" multiple hidden onChange={handleImageChange} />
                </Button>
              </Box>

              {existingImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Current Images</Typography>
                  <Grid container spacing={2}>
                    {existingImages.map((image, index) => (
                      <Grid item key={image.id} xs={6} sm={4} md={3}>
                        <Box sx={{ position: 'relative' }}>
                          <img src={image.image} alt={`Existing ${index}`}
                            style={{ width: '100%', height: 'auto', borderRadius: 4 }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {imagePreviewUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>New Images</Typography>
                  <Grid container spacing={2}>
                    {imagePreviewUrls.map((url, index) => (
                      <Grid item key={index} xs={6} sm={4} md={3}>
                        <Box sx={{ position: 'relative' }}>
                          <img src={url} alt={`Preview ${index}`}
                            style={{ width: '100%', height: 'auto', borderRadius: 4 }} />
                          <IconButton
                            sx={{
                              position: 'absolute', top: 8, right: 8,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
                            }}
                            size="small" onClick={() => handleRemoveImage(index)}
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
              <Button variant="outlined" onClick={() => navigate('/housing')}>Cancel</Button>
              <Button type="submit" variant="contained" color="success" disabled={submitting}>
                {submitting ? <CircularProgress size={24} /> : isEditMode ? 'Update Listing' : 'Post Listing'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default HousingForm;
