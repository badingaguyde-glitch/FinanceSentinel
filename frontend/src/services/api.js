import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getNews = () => api.get('/news');
export const getSentimentSummary = () => api.get('/news/sentiment');
export const getPredictionData = () => api.get('/news/prediction');
export const getFullAnalysis = () => api.get('/news/analysis');
export const syncNews = () => api.post('/news/sync');
export const askAIEngine = (payload) => api.post('/analysis/analyze', payload);

export default api;
