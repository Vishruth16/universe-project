import axios from 'axios';

export interface Recommendation {
  id: number;
  similarity_score: number;
  data: any;
}

export const getHousingRecommendations = async (limit: number = 6): Promise<Recommendation[]> => {
  try {
    const response = await axios.get(`/api/recommendations/housing/?limit=${limit}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching housing recommendations:', err);
    return [];
  }
};

export const getRoommateRecommendations = async (limit: number = 6): Promise<Recommendation[]> => {
  try {
    const response = await axios.get(`/api/recommendations/roommates/?limit=${limit}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching roommate recommendations:', err);
    return [];
  }
};

export const getMarketplaceRecommendations = async (limit: number = 6): Promise<Recommendation[]> => {
  try {
    const response = await axios.get(`/api/recommendations/marketplace/?limit=${limit}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching marketplace recommendations:', err);
    return [];
  }
};

export const getStudyGroupRecommendations = async (limit: number = 6): Promise<Recommendation[]> => {
  try {
    const response = await axios.get(`/api/recommendations/study-groups/?limit=${limit}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching study group recommendations:', err);
    return [];
  }
};
