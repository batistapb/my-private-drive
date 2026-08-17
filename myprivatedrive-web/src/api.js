import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5261/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = sessionStorage.getItem("refreshToken");
    if (!refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      originalRequest.headers.Authorization = "Bearer " + data.accessToken;
      return api(originalRequest);
    } catch (refreshError) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);
