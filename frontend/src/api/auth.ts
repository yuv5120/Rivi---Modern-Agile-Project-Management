import apiClient from './client';
import type { TokenResponse, User } from '../types';

export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  refresh: async (refresh_token: string) => {
    const res = await apiClient.post('/auth/refresh', { refresh_token });
    return res.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.put('/users/me', data);
    return res.data;
  },
};
