import axios from "axios";
import { config, getApiHeaders } from "../config/environment";

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: getApiHeaders(),
  withCredentials: false,
  timeout: config.API_TIMEOUT,
});

if (config.DEBUG_MODE) {
  console.log('🔧 Axios configurado:', {
    baseURL: config.API_BASE_URL,
    timeout: config.API_TIMEOUT,
    headers: getApiHeaders(),
  });
}


// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar 401 globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentCompany");
      // window.location.href = "/login?expired=1"; // Eliminado el redirect
    }
    return Promise.reject(error);
  }
);

export default api;