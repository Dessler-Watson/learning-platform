import { api } from './api';
import { LoginCredentials, AuthResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async getProfile(): Promise<User> {
    return api.get<User>('/auth/profile');
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setAuthData(response: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
