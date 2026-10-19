export interface ClientFetchError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Cliente HTTP para chamadas do navegador para a API interna do Next.js (/api/*).
 * Garante envio de credentials (cookies HttpOnly) e headers padrão.
 */
export async function clientFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "same-origin",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = data as { message?: string; error?: string } | null;
    const error = new Error(
      payload?.message || payload?.error || `Erro HTTP ${response.status}`,
    ) as ClientFetchError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
