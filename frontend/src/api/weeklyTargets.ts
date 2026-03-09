import apiClient from './client';
import {
  WeeklyTarget,
  WeeklyTargetListResponse,
  CreateWeeklyTargetRequest,
  UpdateWeeklyTargetRequest,
} from '../types';

export const weeklyTargetsAPI = {
  list: async (weekStart?: string): Promise<WeeklyTargetListResponse> => {
    const params = weekStart ? { week_start: weekStart } : {};
    const response = await apiClient.get<WeeklyTargetListResponse>('/weekly-targets', { params });
    return response.data;
  },

  create: async (data: CreateWeeklyTargetRequest): Promise<WeeklyTarget> => {
    const response = await apiClient.post<WeeklyTarget>('/weekly-targets', data);
    return response.data;
  },

  update: async (targetId: string, data: UpdateWeeklyTargetRequest): Promise<WeeklyTarget> => {
    const response = await apiClient.patch<WeeklyTarget>(`/weekly-targets/${targetId}`, data);
    return response.data;
  },

  delete: async (targetId: string): Promise<void> => {
    await apiClient.delete(`/weekly-targets/${targetId}`);
  },
};
