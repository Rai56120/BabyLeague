import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Players API
export const playersAPI = {
  getAll: () => api.get('/players'),
  getById: (id) => api.get(`/players/${id}`),
  create: (playerData) => api.post('/players', playerData),
  update: (id, playerData) => api.put(`/players/${id}`, playerData),
  delete: (id) => api.delete(`/players/${id}`),
};

// Matches API
export const matchesAPI = {
  getAll: () => api.get('/matches'),
  getById: (id) => api.get(`/matches/${id}`),
  create: (matchData) => api.post('/matches', matchData),
  update: (id, matchData) => api.put(`/matches/${id}`, matchData),
  delete: (id) => api.delete(`/matches/${id}`),
};

// Statistics API
export const statsAPI = {
  getLeaderboard: () => api.get('/stats/leaderboard'),
  getMatchStats: () => api.get('/stats/matches'),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;