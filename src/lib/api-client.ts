export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T> {
  data: T;
}

export interface RequestConfig {
  params?: Record<string, string | number | boolean | null | undefined>;
}

function withParams(path: string, params?: RequestConfig['params']): string {
  if (!params) return path;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

async function request<T>(path: string, method: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
  const response = await fetch(`/api${withParams(path, config?.params)}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(response.status, `The server returned an unreadable response (${response.status}).`);
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return { data: payload as T };
}

export const api = {
  get: <T>(path: string, config?: RequestConfig) => request<T>(path, "GET", undefined, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>(path, "POST", body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>(path, "PUT", body, config),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>(path, "PATCH", body, config),
  delete: <T>(path: string, config?: RequestConfig) => request<T>(path, "DELETE", undefined, config),
};

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
