import React from 'react';
import { Box, Typography, Container, Grid, Stack, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1E293B',
        color: 'white',
        pt: 6,
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              UniVerse
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', maxWidth: 280, lineHeight: 1.7 }}>
              The AI-powered campus platform connecting students through smart roommate matching,
              marketplace, housing, and study groups.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'grey.300' }}>
              Platform
            </Typography>
            <Stack spacing={1}>
              {[
                { label: 'Marketplace', to: '/marketplace' },
                { label: 'Roommates', to: '/roommate-matching' },
                { label: 'Housing', to: '/housing' },
                { label: 'Study Groups', to: '/study-groups' },
              ].map(link => (
                <MuiLink
                  key={link.label}
                  component={Link}
                  to={link.to}
                  variant="body2"
                  sx={{
                    color: 'grey.500',
                    textDecoration: 'none',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.15s',
                  }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'grey.300' }}>
              Account
            </Typography>
            <Stack spacing={1}>
              {[
                { label: 'Sign In', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'Profile', to: '/profile' },
              ].map(link => (
                <MuiLink
                  key={link.label}
                  component={Link}
                  to={link.to}
                  variant="body2"
                  sx={{
                    color: 'grey.500',
                    textDecoration: 'none',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.15s',
                  }}
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'grey.300' }}>
              Technology
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500', lineHeight: 1.7 }}>
              Built with React, Django REST Framework, and powered by FAISS vector search
              with sentence-transformers for intelligent AI recommendations.
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: 'grey.800', my: 3 }} />
        <Typography variant="body2" sx={{ color: 'grey.600', textAlign: 'center' }}>
          {new Date().getFullYear()} UniVerse. Built for students, by students.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
