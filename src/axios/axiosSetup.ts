import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getCachedAccessToken, useAuthStore } from '@/store/authstore';

export const BACKEND_URL = import.meta.env.VITE_FLOWPAY_BASE_API;
console.log(BACKEND_URL)

// Envelope every backend response is wrapped in.
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  code: number;
  data: T;
}

// Thrown when the HTTP call succeeded but the envelope signals a failure.
export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// Augment AxiosRequestConfig so callers can attach optional per-request
// tracing/idempotency headers without manually building header objects.
declare module 'axios' {
  interface AxiosRequestConfig {
    requestId?: string;
    traceId?: string;
    idempotencyKey?: string;
    _retry?: boolean;
  }
}

export const publicAxios: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const protectedAxios: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ─────────────────────────────────────────────────────
// Reads the current access token from the store at request time (not at
// interceptor registration) so every call uses the freshest token.
protectedAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getCachedAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (config.requestId) config.headers['X-Request-ID'] = config.requestId;
  if (config.traceId) config.headers['X-Trace-ID'] = config.traceId;
  if (config.idempotencyKey) config.headers['Idempotency-Key'] = config.idempotencyKey;

  return config;
});

// ── Response interceptor ────────────────────────────────────────────────────
// On 401: attempt a silent token refresh via the public instance, update the
// store, then retry the original request once. If refresh also fails, clear
// auth state and redirect to the login page.
protectedAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, setTokens } = useAuthStore.getState();

        const { data } = await publicAxios.post<{
          accessToken: string;
          refreshToken: string;
        }>('/auth/refresh', { refreshToken });

        setTokens(data.accessToken, data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return protectedAxios(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
