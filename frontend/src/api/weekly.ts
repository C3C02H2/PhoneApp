import apiClient from './client';

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  yes_days: number;
  no_days: number;
  missed_days: number;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  top_excuses: { category: string; count: number }[];
  mood_trends: Record<string, number>;
  notes_count: number;
  insight: string;
}

export const weeklyAPI = {
  getSummary: async (): Promise<WeeklySummary> => {
    const response = await apiClient.get<WeeklySummary>('/weekly/summary');
    return response.data;
  },
};
