import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'  // Development
  : 'https://your-ec2-instance.com';  // Production

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      clearAuthToken();
      // You can add navigation logic here if needed
    }
    return Promise.reject(error);
  }
);

// Token management functions
const getAuthToken = (): string | null => {
  // In a real app, you'd get this from secure storage
  return localStorage?.getItem('auth_token') || null;
};

const clearAuthToken = (): void => {
  // In a real app, you'd clear this from secure storage
  localStorage?.removeItem('auth_token');
};

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Generic API methods
export const api = {
  get: <T = any>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.get(url, { params }),
  
  post: <T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.post(url, data),
  
  put: <T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.put(url, data),
  
  delete: <T = any>(url: string): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.delete(url),
  
  patch: <T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.patch(url, data),
};

export default apiClient;
