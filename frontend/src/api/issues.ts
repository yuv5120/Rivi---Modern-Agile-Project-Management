import apiClient from './client';
import type { Issue, IssueCreate, IssueUpdate, IssueFilters, IssueStatus } from '../types';

export const issuesApi = {
  list: async (projectId: string, filters?: IssueFilters): Promise<Issue[]> => {
    const params = filters || {};
    const res = await apiClient.get(`/projects/${projectId}/issues`, { params });
    return res.data;
  },

  create: async (projectId: string, data: IssueCreate): Promise<Issue> => {
    const res = await apiClient.post(`/projects/${projectId}/issues`, data);
    return res.data;
  },

  get: async (issueId: string): Promise<Issue> => {
    const res = await apiClient.get(`/issues/${issueId}`);
    return res.data;
  },

  update: async (issueId: string, data: IssueUpdate): Promise<Issue> => {
    const res = await apiClient.put(`/issues/${issueId}`, data);
    return res.data;
  },

  updateStatus: async (issueId: string, status: IssueStatus): Promise<Issue> => {
    const res = await apiClient.patch(`/issues/${issueId}/status`, { status });
    return res.data;
  },

  delete: async (issueId: string): Promise<void> => {
    await apiClient.delete(`/issues/${issueId}`);
  },
};
