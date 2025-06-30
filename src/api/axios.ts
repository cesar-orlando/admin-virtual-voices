import axios from "axios";

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);


// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;