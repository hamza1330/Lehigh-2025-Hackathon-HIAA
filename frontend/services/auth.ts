import { api, ApiResponse } from './api';

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Authentication service
export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    return response.data.data;
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', userData);
    return response.data.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },

  // Get current user profile
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/api/v1/auth/me');
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/api/v1/auth/profile', profileData);
    return response.data.data;
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest): Promise<void> => {
    await api.post('/api/v1/auth/password-reset', data);
  },

  // Confirm password reset
  confirmPasswordReset: async (data: PasswordResetConfirm): Promise<void> => {
    await api.post('/api/v1/auth/password-reset/confirm', data);
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/refresh');
    return response.data.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/api/v1/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: async (): Promise<void> => {
    await api.post('/api/v1/auth/resend-verification');
  },
};

// Token management utilities
export const tokenManager = {
  setToken: (token: string): void => {
    // In React Native, use AsyncStorage or SecureStore
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  getToken: (): string | null => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  removeToken: (): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  isTokenValid: (): boolean => {
    const token = tokenManager.getToken();
    if (!token) return false;
    
    try {
      // Basic JWT token validation (check if it's expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};
