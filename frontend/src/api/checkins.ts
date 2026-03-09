/**
 * API: Check-ins endpoints
 */

import apiClient from './client';
import {
  Checkin,
  CheckinListResponse,
  CreateCheckinRequest,
  StreakResponse,
} from '../types';

export const checkinsAPI = {
  /**
   * Създава дневен check-in
   */
  create: async (data: CreateCheckinRequest): Promise<Checkin> => {
    const response = await apiClient.post<Checkin>('/checkins', data);
    return response.data;
  },

  /**
   * Получава моите check-ins
   */
  getMine: async (skip: number = 0, limit: number = 30): Promise<CheckinListResponse> => {
    const response = await apiClient.get<CheckinListResponse>('/checkins/me', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Получава streak информация
   */
  getStreak: async (): Promise<StreakResponse> => {
    const response = await apiClient.get<StreakResponse>('/checkins/streak');
    return response.data;
  },
};

