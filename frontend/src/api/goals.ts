import apiClient from './client';
import {
  Goal,
  GoalListResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
} from '../types';

export const goalsAPI = {
  list: async (activeOnly: boolean = true): Promise<GoalListResponse> => {
    const response = await apiClient.get<GoalListResponse>('/goals', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  create: async (data: CreateGoalRequest): Promise<Goal> => {
    const response = await apiClient.post<Goal>('/goals', data);
    return response.data;
  },

  update: async (goalId: string, data: UpdateGoalRequest): Promise<Goal> => {
    const response = await apiClient.patch<Goal>(`/goals/${goalId}`, data);
    return response.data;
  },

  delete: async (goalId: string): Promise<void> => {
    await apiClient.delete(`/goals/${goalId}`);
  },
};
