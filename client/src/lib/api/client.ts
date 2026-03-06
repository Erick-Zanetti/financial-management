const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/financial-release';
const API_BASE_URL = API_URL.replace(/\/financial-release$/, '');

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

async function fetchApi<T>(baseUrl: string, endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${baseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

export { API_BASE_URL };

export function createApiClient(baseUrl: string) {
  return {
    get: <T>(endpoint: string, params?: Record<string, string | number>) =>
      fetchApi<T>(baseUrl, endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, data: unknown) =>
      fetchApi<T>(baseUrl, endpoint, { method: 'POST', body: JSON.stringify(data) }),

    patch: <T>(endpoint: string, data: unknown) =>
      fetchApi<T>(baseUrl, endpoint, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: <T>(endpoint: string) =>
      fetchApi<T>(baseUrl, endpoint, { method: 'DELETE' }),
  };
}

export const apiClient = createApiClient(API_URL);
