/**
 * API: Posts endpoints
 */

import apiClient from './client';
import { Post, PostListResponse, CreatePostRequest, LikeResponse } from '../types';

export const postsAPI = {
  getAll: async (
    skip: number = 0,
    limit: number = 20,
    sortBy: string = 'recent',
    category?: string,
  ): Promise<PostListResponse> => {
    const params: any = { skip, limit, sort_by: sortBy };
    if (category) params.category = category;
    const response = await apiClient.get<PostListResponse>('/posts', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Post> => {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  },

  create: async (data: CreatePostRequest): Promise<Post> => {
    const response = await apiClient.post<Post>('/posts', data);
    return response.data;
  },

  toggleLike: async (postId: string): Promise<LikeResponse> => {
    const response = await apiClient.post<LikeResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  delete: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },
};

