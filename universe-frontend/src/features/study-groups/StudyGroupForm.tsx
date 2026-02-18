import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, Grid, Paper, CircularProgress, Alert, FormHelperText,
  FormControlLabel, Checkbox, Container
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { StudyGroup } from './types';
import { useFormik } from 'formik';
import * as yup from 'yup';

interface FormValues {
  name: string;
  course_code: string;
  subject_area: string;
  description: string;
  max_members: string;
  meeting_location: string;
  meeting_schedule: string;
  meeting_frequency: string;
  is_online: boolean;
  meeting_link: string;
}

const validationSchema = yup.object({
  name: yup.string().required('Name is required').max(200),
  subject_area: yup.string().required('Subject area is required'),
  description: yup.string().required('Description is required'),
  max_members: yup.string().required('Max members is required'),
  meeting_frequency: yup.string().required('Meeting frequency is required'),
});

const StudyGroupForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!id;

  const formik = useFormik<FormValues>({
    initialValues: {
      name: '',
      course_code: '',
      subject_area: '',
      description: '',
      max_members: '10',
      meeting_location: '',
      meeting_schedule: '',
      meeting_frequency: 'weekly',
      is_online: false,
      meeting_link: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchGroupDetails();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/study-groups/${id}/`);
      const group: StudyGroup = response.data;
      formik.setValues({
        name: group.name,
        course_code: group.course_code,
        subject_area: group.subject_area,
        description: group.description,
        max_members: group.max_members.toString(),
        meeting_location: group.meeting_location,
        meeting_schedule: group.meeting_schedule,
        meeting_frequency: group.meeting_frequency,
        is_online: group.is_online,
        meeting_link: group.meeting_link,
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to fetch group details');
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...values,
        max_members: parseInt(values.max_members),
      };

      let response;
      if (isEditMode) {
        response = await axios.patch(`/api/study-groups/${id}/`, payload);
      } else {
        response = await axios.post('/api/study-groups/', payload);
      }

      setSubmitting(false);
      navigate(`/study-groups/${response.data.id}`);
    } catch (err) {
      setSubmitting(false);
      setError('Failed to save study group. Please check your inputs and try again.');
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

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as_needed', label: 'As Needed' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Study Group' : 'Create Study Group'}
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth name="name" label="Group Name"
                value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="subject_area" label="Subject Area"
                placeholder="e.g., Computer Science, Mathematics"
                value={formik.values.subject_area} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.subject_area && Boolean(formik.errors.subject_area)}
                helperText={formik.touched.subject_area && formik.errors.subject_area}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="course_code" label="Course Code (Optional)"
                placeholder="e.g., CS101, MATH201"
                value={formik.values.course_code} onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth name="max_members" label="Max Members" type="number"
                value={formik.values.max_members} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.max_members && Boolean(formik.errors.max_members)}
                helperText={formik.touched.max_members && formik.errors.max_members}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={formik.touched.meeting_frequency && Boolean(formik.errors.meeting_frequency)}>
                <InputLabel>Meeting Frequency</InputLabel>
                <Select
                  name="meeting_frequency" value={formik.values.meeting_frequency}
                  label="Meeting Frequency" onChange={formik.handleChange} onBlur={formik.handleBlur}
                >
                  {frequencyOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {formik.touched.meeting_frequency && formik.errors.meeting_frequency && (
                  <FormHelperText>{formik.errors.meeting_frequency}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth name="meeting_schedule" label="Schedule (Optional)"
                placeholder="e.g., Mon/Wed 3-5 PM"
                value={formik.values.meeting_schedule} onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="is_online" checked={formik.values.is_online}
                    onChange={formik.handleChange}
                  />
                }
                label="This is an online study group"
              />
            </Grid>

            {formik.values.is_online ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth name="meeting_link" label="Meeting Link (Optional)"
                  placeholder="e.g., https://zoom.us/j/..."
                  value={formik.values.meeting_link} onChange={formik.handleChange}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth name="meeting_location" label="Meeting Location (Optional)"
                  placeholder="e.g., Library Room 204"
                  value={formik.values.meeting_location} onChange={formik.handleChange}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth name="description" label="Description" multiline rows={4}
                value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/study-groups')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? <CircularProgress size={24} /> : isEditMode ? 'Update Group' : 'Create Group'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default StudyGroupForm;
