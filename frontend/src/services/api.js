import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "An unexpected error occurred";
    const enriched = new Error(message);
    enriched.status = error.response?.status;
    enriched.details = error.response?.data?.error?.details;
    enriched.code = error.response?.data?.error?.code;
    throw enriched;
  },
);

export default api;
