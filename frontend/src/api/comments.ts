import apiClient from './client';
import { CommentListResponse, CreateCommentRequest, Comment } from '../types';

export const commentsAPI = {
  getByPost: async (postId: string): Promise<CommentListResponse> => {
    const response = await apiClient.get<CommentListResponse>(
      `/posts/${postId}/comments`
    );
    return response.data;
  },

  create: async (
    postId: string,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await apiClient.post<Comment>(
      `/posts/${postId}/comments`,
      data
    );
    return response.data;
  },
};
