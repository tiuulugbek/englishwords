import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Store JWT token
let authToken: string | null = null;

export const api = {
  setToken(token: string) {
    authToken = token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  async authenticate(initData: string) {
    const response = await apiClient.post('/auth/telegram', { initData });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get('/words/categories');
    return response.data;
  },

  async getTodayWords(limit: number = 10) {
    const response = await apiClient.get(`/study/today?limit=${limit}`);
    return response.data;
  },

  async startTest(type: 'quick' | 'full' | 'daily' = 'quick') {
    const response = await apiClient.post('/tests/start', { type });
    return response.data;
  },

  async submitAnswer(testId: number, questionId: number, userAnswer: string) {
    const response = await apiClient.post(`/tests/${testId}/answer`, {
      questionId,
      userAnswer,
    });
    return response.data;
  },

  async finishTest(testId: number) {
    const response = await apiClient.post(`/tests/${testId}/finish`);
    return response.data;
  },

  async getLeaderboard(range: 'week' | 'month' | 'all' = 'week') {
    const response = await apiClient.get(`/leaderboard?range=${range}`);
    return response.data;
  },
};

export default api;

