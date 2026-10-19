import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://192.168.160.121:8000/api";

/**
 * Instância do Axios para comunicação com o Backend Externo (Laravel / API REST).
 * Utilizada pela camada de Services no servidor Next.js.
 */
export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR: Injeção de credenciais e headers
// ==========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Injeta header se configurado (ex: API key do backend ou cabeçalho de proxy)
    if (process.env.BACKEND_API_KEY) {
      config.headers["X-API-KEY"] = process.env.BACKEND_API_KEY;
    }

    config.headers["X-Requested-With"] = "XMLHttpRequest";

    if (process.env.NODE_ENV === "development") {
      console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR: Tratamento de Erros da API Externa
// ==========================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`[API Error] Status ${status} em ${url}:`, error.response?.data || error.message);

    // Tratamento especializado para erros 422 de validação do Laravel / APIs REST
    if (status === 422) {
      return Promise.reject({
        status: 422,
        isValidationError: true,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

export class ApiUnauthorizedError extends Error {
  constructor(message = "Sessão expirada") {
    super(message);
    this.name = "ApiUnauthorizedError";
  }
}

/**
 * Axios instance with the current agent's Sanctum Bearer token (server-only).
 */
export async function getAuthedApi(): Promise<AxiosInstance> {
  const reqHeaders = await headers();
  const jwt = await getToken({
    req: { headers: Object.fromEntries(reqHeaders.entries()) },
    secret: process.env.AUTH_SECRET,
  });

  const accessToken = jwt?.accessToken;
  if (!accessToken || typeof accessToken !== "string") {
    throw new ApiUnauthorizedError();
  }

  const authed = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  authed.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        return Promise.reject(new ApiUnauthorizedError());
      }
      return Promise.reject(error);
    },
  );

  return authed;
}

export default api;
