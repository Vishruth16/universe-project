import React from 'react';
import {
  Box, Typography, Button, Container, Grid,
  Card, CardContent, CardActions, Chip, Avatar,
  Stack, useTheme, useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      title: 'Smart Roommate Matching',
      desc: 'AI algorithm analyzes lifestyle preferences, study habits, and personality traits to find your perfect roommate.',
      tags: ['AI-Powered', '95% Success'],
      color: '#4F46E5',
      link: '/roommate-matching',
      cta: 'Find Roommates',
    },
    {
      icon: <StoreIcon sx={{ fontSize: 28 }} />,
      title: 'Campus Marketplace',
      desc: 'Buy, sell, and trade items with fellow students in a secure, trusted marketplace designed for campus life.',
      tags: ['Secure', 'Campus-Only'],
      color: '#0EA5E9',
      link: '/marketplace',
      cta: 'Browse Items',
    },
    {
      icon: <HomeIcon sx={{ fontSize: 28 }} />,
      title: 'Housing Locator',
      desc: 'Discover the best housing options near campus with AI recommendations based on your budget and preferences.',
      tags: ['AI Recommendations', 'Budget-Friendly'],
      color: '#10B981',
      link: '/housing',
      cta: 'Find Housing',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 28 }} />,
      title: 'Study Groups',
      desc: 'Find or create study groups for your courses. Collaborate with peers, share resources, and ace your classes.',
      tags: ['Collaborative', 'Course-Based'],
      color: '#3B82F6',
      link: '/study-groups',
      cta: 'Join Groups',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 40%, #0EA5E9 100%)',
          color: 'white',
          minHeight: isAuthenticated ? '60vh' : '92vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -120, right: -120, width: 500, height: 500,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -200, left: -200, width: 600, height: 600,
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
        }} />
        <Box sx={{
          position: 'absolute', top: '30%', right: '15%', width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={isAuthenticated ? 12 : 7}>
              <Box sx={{ textAlign: isAuthenticated ? 'center' : 'left', maxWidth: isAuthenticated ? 700 : undefined, mx: isAuthenticated ? 'auto' : undefined }}>
                {isAuthenticated ? (
                  <>
                    <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" sx={{ fontWeight: 800, mb: 2 }}>
                      Welcome back, {user?.username}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.85, mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
                      Your AI-powered campus hub is ready. What would you like to do today?
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        to="/profile"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          px: 4,
                          borderRadius: 3,
                        }}
                      >
                        My Profile
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        to="/marketplace"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          px: 4,
                          borderRadius: 3,
                        }}
                      >
                        Marketplace
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        to="/housing"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          px: 4,
                          borderRadius: 3,
                        }}
                      >
                        Find Housing
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <>
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                      label="AI-Powered Campus Platform"
                      sx={{
                        mb: 3,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        px: 1,
                      }}
                    />
                    <Typography
                      variant={isMobile ? 'h3' : 'h2'}
                      component="h1"
                      sx={{
                        fontWeight: 800,
                        mb: 3,
                        lineHeight: 1.1,
                      }}
                    >
                      Your campus life,{' '}
                      <Box component="span" sx={{ opacity: 0.7 }}>reimagined</Box>
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        opacity: 0.85,
                        lineHeight: 1.7,
                        mb: 4.5,
                        fontWeight: 400,
                        maxWidth: 520,
                      }}
                    >
                      Connect with roommates, discover housing, trade in the marketplace,
                      and find study groups - all powered by intelligent AI matching.
                    </Typography>

                    <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        to="/register"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          bgcolor: 'white',
                          color: '#4F46E5',
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.9)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Get Started Free
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        component={Link}
                        to="/login"
                        sx={{
                          borderColor: 'rgba(255,255,255,0.5)',
                          color: 'white',
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                        }}
                      >
                        Sign In
                      </Button>
                    </Stack>
                  </>
                )}
              </Box>
            </Grid>

            {!isAuthenticated && !isMobile && (
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    p: 4,
                  }}
                >
                  <Stack spacing={3}>
                    {[
                      { num: '10K+', label: 'Active Students', color: '#FBBF24' },
                      { num: '95%', label: 'Match Success Rate', color: '#34D399' },
                      { num: '2K+', label: 'Housing Listings', color: '#60A5FA' },
                      { num: '500+', label: 'Study Groups', color: '#38BDF8' },
                    ].map(stat => (
                      <Box key={stat.label} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Box sx={{
                          width: 56, height: 56, borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Typography sx={{ fontWeight: 800, color: stat.color, fontSize: '0.85rem', lineHeight: 1 }}>
                            {stat.num}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, opacity: 0.9 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Chip
            label="Features"
            size="small"
            sx={{ mb: 2, bgcolor: 'primary.main', color: 'white', fontWeight: 700 }}
          />
          <Typography variant="h3" component="h2" gutterBottom fontWeight={800}>
            Everything you need
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto', fontWeight: 400 }}>
            A complete platform designed to make your campus experience smarter and more connected
          </Typography>
        </Box>

        <Grid container spacing={3.5}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                <CardContent sx={{ p: 3.5, flexGrow: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: feature.color + '14',
                      color: feature.color,
                      mb: 2.5,
                      width: 52,
                      height: 52,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                    {feature.desc}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {feature.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 24,
                          bgcolor: feature.color + '12',
                          color: feature.color,
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3.5, pb: 3 }}>
                  <Button
                    component={Link}
                    to={feature.link}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '16px !important' }} />}
                    sx={{
                      color: feature.color,
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: feature.color + '0A',
                      },
                    }}
                  >
                    {feature.cta}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* AI Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="AI Technology"
              size="small"
              sx={{ mb: 2, bgcolor: 'primary.main', color: 'white', fontWeight: 700 }}
            />
            <Typography variant="h3" component="h2" gutterBottom fontWeight={800}>
              Powered by advanced AI
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontWeight: 400 }}>
              Intelligent automation that learns and adapts to your preferences
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { icon: <SpeedIcon />, title: 'Lightning Fast Matching', desc: 'Get matched with compatible roommates in under 2 minutes using semantic embeddings', color: '#3B82F6' },
              { icon: <SecurityIcon />, title: 'Secure & Private', desc: 'Your data is protected with enterprise-grade security and encryption', color: '#F59E0B' },
              { icon: <TrendingUpIcon />, title: 'Smart Recommendations', desc: 'RAG pipeline learns your preferences for continuously improving matches', color: '#10B981' },
              { icon: <StarIcon />, title: 'Personalized Experience', desc: 'Cold-start handling ensures great results even for new users', color: '#EF4444' },
            ].map(item => (
              <Grid item xs={12} sm={6} key={item.title}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2.5,
                    p: 3,
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'white', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)' },
                  }}
                >
                  <Avatar sx={{ bgcolor: item.color + '14', color: item.color, width: 48, height: 48 }}>
                    {item.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
            color: 'white',
            py: 10,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute', top: -80, right: -80, width: 300, height: 300,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          }} />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h3" component="h2" gutterBottom fontWeight={800}>
              Ready to get started?
            </Typography>
            <Typography variant="h6" paragraph sx={{ opacity: 0.85, mb: 4, fontWeight: 400 }}>
              Join thousands of students already using UniVerse to enhance their campus experience.
            </Typography>
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/register"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: 'white',
                  color: '#4F46E5',
                  px: 5,
                  py: 1.8,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Create Free Account
              </Button>
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
