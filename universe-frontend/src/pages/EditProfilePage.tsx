import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  SelectChangeEvent,
  Card,
  CardContent,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Interests as InterestsIcon,
  Description as DescriptionIcon,
  CameraAlt as CameraIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    age: '' as string | number,
    gender: '',
    interests: '',
    course_major: '',
    bio: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/profiles/?current_user=true');
        // Handle both paginated and non-paginated responses
        const data = response.data;
        const results = data.results || data;
        if (Array.isArray(results) && results.length > 0) {
          const profile = results[0];
          setProfileId(profile.id);

          setFormValues({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            age: profile.age || '',
            gender: profile.gender || '',
            interests: profile.interests || '',
            course_major: profile.course_major || '',
            bio: profile.bio || '',
          });

          if (profile.profile_picture) {
            setImagePreview(profile.profile_picture);
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();

      Object.keys(formValues).forEach(key => {
        if (formValues[key as keyof typeof formValues] !== '') {
          formData.append(key, formValues[key as keyof typeof formValues].toString());
        }
      });

      if (profileImage) {
        formData.append('profile_picture', profileImage);
      }

      if (profileId) {
        await axios.patch(`/api/profiles/${profileId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('/api/profiles/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSubmitting(false);
      navigate('/profile');
    } catch (err: any) {
      setSubmitting(false);
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setError(`Failed to save profile: ${errorMessages}`);
      } else {
        setError('Failed to save profile. Please try again later.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const initials = `${(formValues.first_name || '')[0] || ''}${(formValues.last_name || '')[0] || ''}`.toUpperCase() || 'U';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
          color: 'white',
          py: 5,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={800}>
            {profileId ? 'Edit Profile' : 'Create Profile'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mt: 1 }}>
            {profileId ? 'Update your information to improve AI recommendations' : 'Set up your profile to get started'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 4, mt: -3 }}>
        <Card sx={{ overflow: 'visible' }}>
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Photo Section */}
                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={imagePreview || undefined}
                    alt="Profile Picture"
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      bgcolor: 'primary.main',
                      boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    {!imagePreview && initials}
                  </Avatar>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CameraIcon />}
                    size="small"
                  >
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="first_name"
                    label="First Name"
                    value={formValues.first_name}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="last_name"
                    label="Last Name"
                    value={formValues.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>

                {/* Age & Gender */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="age"
                    label="Age"
                    type="number"
                    value={formValues.age}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={formValues.gender}
                      label="Gender"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="">Prefer not to say</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="non-binary">Non-binary</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Major */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="course_major"
                    label="Major / Course of Study"
                    value={formValues.course_major}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Interests */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="interests"
                    label="Interests"
                    value={formValues.interests}
                    onChange={handleInputChange}
                    placeholder="hiking, reading, gaming, cooking (comma-separated)"
                    helperText="Separate interests with commas. This helps AI match you with compatible roommates and groups."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InterestsIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Bio */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="bio"
                    label="Bio"
                    multiline
                    rows={4}
                    value={formValues.bio}
                    onChange={handleInputChange}
                    placeholder="Tell others about yourself - your hobbies, what you're studying, what you're looking for..."
                    helperText="A detailed bio helps our AI provide better recommendations."
                  />
                </Grid>

                {/* Actions */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => navigate('/profile')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={submitting ? undefined : <SaveIcon />}
                      disabled={submitting}
                      sx={{
                        px: 4,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4338CA 0%, #1D4ED8 100%)',
                        },
                      }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default EditProfilePage;
