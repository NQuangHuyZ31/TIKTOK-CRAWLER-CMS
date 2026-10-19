import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

const csrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

http.interceptors.request.use((config) => {
    const token = csrfToken();
    if (token) {
        config.headers.set('X-CSRF-TOKEN', token);
    }
    return config;
});

http.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
        if (error instanceof AxiosError) {
            const payload = (error.response?.data ?? {}) as { message?: string; errors?: Record<string, string[]> };
            const status = error.response?.status ?? 0;
            const message =
                payload.message ??
                (status === 419 ? 'CSRF token mismatch. Please reload the page.' : error.message);
            return Promise.reject(new ApiError(status, message, payload.errors ?? {}));
        }
        return Promise.reject(error);
    }
);

export async function api<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const response = await http<T>({ url, ...config });
    return response.data;
}

export default http;
