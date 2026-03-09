import apiClient from './client';

export interface ChatRequestData {
  id: string;
  sender_id: string;
  sender_username: string;
  receiver_id: string;
  receiver_username: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

export interface ChatSessionData {
  id: string;
  user1_id: string;
  user1_username: string;
  user2_id: string;
  user2_username: string;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ChatMessageData {
  id: string;
  session_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  created_at: string;
}

export interface ChatListData {
  requests: ChatRequestData[];
  sessions: ChatSessionData[];
}

export const chatAPI = {
  getChats: async (): Promise<ChatListData> => {
    const response = await apiClient.get<ChatListData>('/chat');
    return response.data;
  },

  sendRequest: async (receiverId: string, durationMinutes: number): Promise<ChatRequestData> => {
    const response = await apiClient.post<ChatRequestData>('/chat/request', {
      receiver_id: receiverId,
      duration_minutes: durationMinutes,
    });
    return response.data;
  },

  respondToRequest: async (requestId: string, action: 'accept' | 'decline'): Promise<any> => {
    const response = await apiClient.post(`/chat/request/${requestId}/respond`, { action });
    return response.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessageData[]> => {
    const response = await apiClient.get<ChatMessageData[]>(`/chat/session/${sessionId}/messages`);
    return response.data;
  },

  sendMessage: async (sessionId: string, content: string): Promise<ChatMessageData> => {
    const response = await apiClient.post<ChatMessageData>(`/chat/session/${sessionId}/message`, { content });
    return response.data;
  },
};
