import apiClient from './client';
import type { Comment } from '../types';

export const commentsApi = {
  list: async (issueId: string): Promise<Comment[]> => {
    const res = await apiClient.get(`/issues/${issueId}/comments`);
    return res.data;
  },

  create: async (issueId: string, body: string): Promise<Comment> => {
    const res = await apiClient.post(`/issues/${issueId}/comments`, { body });
    return res.data;
  },

  update: async (commentId: string, body: string): Promise<Comment> => {
    const res = await apiClient.put(`/comments/${commentId}`, { body });
    return res.data;
  },

  delete: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
