import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://agbackend-78.onrender.com/api',
  withCredentials: true,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.get('/cors-test').then((res) => {
  console.log(res.data);
}).catch((err) => {
  console.log(err);
});

export default api;
