import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions,
  Button, Chip, CircularProgress, IconButton
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Recommendation } from '../services/recommendations';
import { useAuth } from '../contexts/AuthContext';

interface RecommendationCarouselProps {
  title?: string;
  fetchRecommendations: (limit?: number) => Promise<Recommendation[]>;
  renderCard: (rec: Recommendation) => React.ReactNode;
  linkPrefix: string;
}

const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  title = 'Recommended for You',
  fetchRecommendations,
  renderCard,
  linkPrefix,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scrollIndex, setScrollIndex] = useState<number>(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await fetchRecommendations(8);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
    setLoading(false);
  };

  if (!isAuthenticated) return null;
  if (!loading && recommendations.length === 0) return null;

  const visibleCount = 4;
  const maxScroll = Math.max(0, recommendations.length - visibleCount);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip
          icon={<AIIcon sx={{ fontSize: 16 }} />}
          label="Powered by AI"
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
            color: 'white',
            fontWeight: 600,
            '& .MuiChip-icon': { color: 'white' },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {scrollIndex > 0 && (
            <IconButton
              onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
              sx={{
                position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
                zIndex: 1, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflow: 'hidden',
              px: 1,
            }}
          >
            {recommendations.slice(scrollIndex, scrollIndex + visibleCount).map((rec) => (
              <Box
                key={rec.id}
                sx={{ minWidth: `calc(${100 / visibleCount}% - ${(2 * (visibleCount - 1)) / visibleCount}rem)`, flex: '0 0 auto' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                >
                  {rec.similarity_score > 0 && (
                    <Chip
                      label={`${Math.round(rec.similarity_score * 100)}% match`}
                      size="small"
                      sx={{
                        position: 'absolute', top: 8, right: 8,
                        fontWeight: 700, fontSize: '0.7rem',
                        bgcolor: 'primary.main', color: 'white',
                      }}
                    />
                  )}
                  {renderCard(rec)}
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      component={Link}
                      to={`${linkPrefix}/${rec.id}`}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>

          {scrollIndex < maxScroll && (
            <IconButton
              onClick={() => setScrollIndex(Math.min(maxScroll, scrollIndex + 1))}
              sx={{
                position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
                zIndex: 1, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RecommendationCarousel;
