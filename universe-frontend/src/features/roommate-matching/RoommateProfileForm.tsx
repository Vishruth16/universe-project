// src/features/roommate-matching/RoommateProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, FormControl, 
  InputLabel, Select, MenuItem, Button, CircularProgress,
  Alert, Slider, FormHelperText, InputAdornment, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { RoommateProfile, UserProfile } from './types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


const validationSchema = yup.object({
  smoking_preference: yup.string().required('Smoking preference is required'),
  drinking_preference: yup.string().required('Drinking preference is required'),
  sleep_habits: yup.string().required('Sleep habits is required'),
  study_habits: yup.string().required('Study habits is required'),
  guests_preference: yup.string().required('Guests preference is required'),
  cleanliness_level: yup.number().required('Cleanliness level is required').min(1).max(5),
  max_rent_budget: yup.number().nullable().positive('Budget must be positive'),
  preferred_move_in_date: yup.date().nullable(),
});

const RoommateProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch the user's profile
      const profileResponse = await axios.get('/api/profiles/?current_user=true');
      if (profileResponse.data.length === 0) {
        setError('Please complete your user profile first');
        setLoading(false);
        return;
      }
      
      setUserProfile(profileResponse.data[0]);
      
      // Fetch the user's roommate profile if it exists
      try {
        const roommateProfileResponse = await axios.get(`/api/roommate-profiles/?user_profile=${profileResponse.data[0].id}`);
        if (roommateProfileResponse.data.length > 0) {
          const roommateProfile = roommateProfileResponse.data[0];
          formik.setValues({
            smoking_preference: roommateProfile.smoking_preference,
            drinking_preference: roommateProfile.drinking_preference,
            sleep_habits: roommateProfile.sleep_habits,
            study_habits: roommateProfile.study_habits,
            guests_preference: roommateProfile.guests_preference,
            cleanliness_level: roommateProfile.cleanliness_level,
            max_rent_budget: roommateProfile.max_rent_budget,
            preferred_move_in_date: roommateProfile.preferred_move_in_date ? new Date(roommateProfile.preferred_move_in_date) : null,
          });
        }
      } catch (err) {
        // It's okay if the roommate profile doesn't exist yet
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch user profile');
      console.error('Error fetching profile:', err);
    }
  };
  
  const formik = useFormik({
    initialValues: {
      smoking_preference: 'no_preference',
      drinking_preference: 'no_preference',
      sleep_habits: 'average',
      study_habits: 'library',
      guests_preference: 'no_preference',
      cleanliness_level: 3,
      max_rent_budget: null as number | null,
      preferred_move_in_date: null as Date | null,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!userProfile) return;
      
      setSubmitting(true);
      setError(null);
      
      try {
        // Check if roommate profile already exists
        const checkResponse = await axios.get(`/api/roommate-profiles/?user_profile=${userProfile.id}`);
        const profileExists = checkResponse.data.length > 0;
        const profileId = profileExists ? checkResponse.data[0].id : null;
        
        const formattedData = {
          ...values,
          user_profile: userProfile.id,
        };
        
        let response;
        if (profileExists) {
          response = await axios.patch(`/api/roommate-profiles/${profileId}/`, formattedData);
        } else {
          response = await axios.post('/api/roommate-profiles/', formattedData);
        }
        
        setSubmitting(false);
        navigate('/roommate-matching');
      } catch (err) {
        setSubmitting(false);
        setError('Failed to save roommate profile. Please check your inputs and try again.');
        console.error('Error submitting form:', err);
      }
    },
  });
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && error === 'Please complete your user profile first') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/profile/edit')}
        >
          Complete Profile
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Roommate Preferences
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
              <Typography variant="h6" gutterBottom>
                Lifestyle Preferences
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.smoking_preference && Boolean(formik.errors.smoking_preference)}>
                <InputLabel>Smoking Preference</InputLabel>
                <Select
                  name="smoking_preference"
                  value={formik.values.smoking_preference}
                  label="Smoking Preference"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="yes">I smoke</MenuItem>
                  <MenuItem value="no">I don't smoke</MenuItem>
                  <MenuItem value="sometimes">I smoke occasionally</MenuItem>
                  <MenuItem value="no_preference">No preference</MenuItem>
                </Select>
                {formik.touched.smoking_preference && formik.errors.smoking_preference && (
                  <FormHelperText>{formik.errors.smoking_preference}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.drinking_preference && Boolean(formik.errors.drinking_preference)}>
                <InputLabel>Drinking Preference</InputLabel>
                <Select
                  name="drinking_preference"
                  value={formik.values.drinking_preference}
                  label="Drinking Preference"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="yes">I drink</MenuItem>
                  <MenuItem value="no">I don't drink</MenuItem>
                  <MenuItem value="sometimes">I drink occasionally</MenuItem>
                  <MenuItem value="no_preference">No preference</MenuItem>
                </Select>
                {formik.touched.drinking_preference && formik.errors.drinking_preference && (
                  <FormHelperText>{formik.errors.drinking_preference}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.sleep_habits && Boolean(formik.errors.sleep_habits)}>
                <InputLabel>Sleep Habits</InputLabel>
                <Select
                  name="sleep_habits"
                  value={formik.values.sleep_habits}
                  label="Sleep Habits"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="early_riser">Early Riser</MenuItem>
                  <MenuItem value="night_owl">Night Owl</MenuItem>
                  <MenuItem value="average">Average</MenuItem>
                </Select>
                {formik.touched.sleep_habits && formik.errors.sleep_habits && (
                  <FormHelperText>{formik.errors.sleep_habits}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.study_habits && Boolean(formik.errors.study_habits)}>
                <InputLabel>Study Habits</InputLabel>
                <Select
                  name="study_habits"
                  value={formik.values.study_habits}
                  label="Study Habits"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="in_room">I prefer to study in my room</MenuItem>
                  <MenuItem value="library">I prefer to study in the library</MenuItem>
                  <MenuItem value="other_places">I prefer to study in other places</MenuItem>
                </Select>
                {formik.touched.study_habits && formik.errors.study_habits && (
                  <FormHelperText>{formik.errors.study_habits}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.guests_preference && Boolean(formik.errors.guests_preference)}>
                <InputLabel>Guests Preference</InputLabel>
                <Select
                  name="guests_preference"
                  value={formik.values.guests_preference}
                  label="Guests Preference"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="yes">I'm okay with guests</MenuItem>
                  <MenuItem value="no">I prefer no guests</MenuItem>
                  <MenuItem value="sometimes">I'm okay with occasional guests</MenuItem>
                  <MenuItem value="no_preference">No preference</MenuItem>
                </Select>
                {formik.touched.guests_preference && formik.errors.guests_preference && (
                  <FormHelperText>{formik.errors.guests_preference}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography id="cleanliness-slider" gutterBottom>
                Cleanliness Level: {formik.values.cleanliness_level}
              </Typography>
              <Slider
                name="cleanliness_level"
                value={formik.values.cleanliness_level}
                onChange={(_, value) => formik.setFieldValue('cleanliness_level', value)}
                aria-labelledby="cleanliness-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={5}
              />
              {formik.touched.cleanliness_level && formik.errors.cleanliness_level && (
                <FormHelperText error>{formik.errors.cleanliness_level}</FormHelperText>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Very Messy (1)</Typography>
                <Typography variant="caption">Very Clean (5)</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Housing Preferences
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="max_rent_budget"
                label="Maximum Monthly Rent Budget"
                value={formik.values.max_rent_budget || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.max_rent_budget && Boolean(formik.errors.max_rent_budget)}
                helperText={formik.touched.max_rent_budget && formik.errors.max_rent_budget}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                {/* Find the DatePicker component and replace it with: */}
                <TextField
                    fullWidth
                    name="preferred_move_in_date"
                    label="Preferred Move-in Date"
                    type="date"
                    value={formik.values.preferred_move_in_date ? new Date(formik.values.preferred_move_in_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => formik.setFieldValue('preferred_move_in_date', e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    error={formik.touched.preferred_move_in_date && Boolean(formik.errors.preferred_move_in_date)}
                    helperText={formik.touched.preferred_move_in_date && formik.errors.preferred_move_in_date as string}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/roommate-matching')}
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
                  'Save Preferences'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default RoommateProfileForm;