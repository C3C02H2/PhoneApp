import apiClient from './client';

export interface CalendarData {
  year: number;
  month: number;
  days: Record<string, boolean>;
}

export interface DashboardData {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_no: number;
  success_rate: number;
  checked_in_today: boolean;
  consistency_7d: number;
  consistency_30d: number;
  top_excuses: { category: string; count: number }[];
  mood_distribution: Record<string, number>;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export const statsAPI = {
  getCalendar: async (year: number, month: number): Promise<CalendarData> => {
    const response = await apiClient.get<CalendarData>('/stats/calendar', {
      params: { year, month },
    });
    return response.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/stats/dashboard');
    return response.data;
  },

  getAchievements: async (): Promise<{ achievements: Achievement[] }> => {
    const response = await apiClient.get<{ achievements: Achievement[] }>('/stats/achievements');
    return response.data;
  },
};
