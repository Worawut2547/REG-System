import axios from 'axios';

export const apiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:8000";



export const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if(token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);