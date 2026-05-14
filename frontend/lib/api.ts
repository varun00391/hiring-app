import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

const raw =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api/v1";
const baseURL = raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;

export const api = axios.create({
  baseURL,
  timeout: 120_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clear();
    }
    return Promise.reject(err);
  },
);
