import axios from 'axios';

export const checkAuthStatus = async () => {
  try {
    const response = await axios.get('/api/check-auth', { withCredentials: true });
    return response.data;
  } catch (error) {
    return { isAuthenticated: false };
  }
};