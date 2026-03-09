import apiClient from './client';
import { User, UserProfile, UserSearchResult, UserSearchResponse, FollowResponse } from '../types';

export interface UserSettings {
  is_private: boolean;
  notifications_enabled: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  evening_reminder_enabled: boolean;
  evening_reminder_time: string;
  default_anonymous: boolean;
  weekly_summary_enabled: boolean;
}

export const usersAPI = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  getMyStats: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me/stats');
    return response.data;
  },

  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(`/users/${userId}/profile`);
    return response.data;
  },

  search: async (query: string, skip: number = 0, limit: number = 20): Promise<UserSearchResponse> => {
    const response = await apiClient.get<UserSearchResponse>('/users/search', {
      params: { q: query, skip, limit },
    });
    return response.data;
  },

  toggleFollow: async (userId: string): Promise<FollowResponse> => {
    const response = await apiClient.post<FollowResponse>(`/users/${userId}/follow`);
    return response.data;
  },

  toggleBlock: async (userId: string): Promise<{ blocked: boolean }> => {
    const response = await apiClient.post<{ blocked: boolean }>(`/users/${userId}/block`);
    return response.data;
  },

  savePushToken: async (token: string): Promise<void> => {
    await apiClient.post('/users/push-token', { token });
  },

  removePushToken: async (token: string): Promise<void> => {
    await apiClient.delete('/users/push-token', { data: { token } });
  },

  updateUsername: async (username: string): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/username', { username });
    return response.data;
  },

  updateEmail: async (email: string): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/email', { email });
    return response.data;
  },

  changePassword: async (current_password: string, new_password: string): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/users/me/password', { current_password, new_password });
    return response.data;
  },

  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<UserSettings>('/users/me/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.patch<UserSettings>('/users/me/settings', settings);
    return response.data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>('/users/me');
    return response.data;
  },

  getBlockedUsers: async (): Promise<UserSearchResponse> => {
    const response = await apiClient.get<UserSearchResponse>('/users/me/blocked');
    return response.data;
  },
};
