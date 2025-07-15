import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);


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