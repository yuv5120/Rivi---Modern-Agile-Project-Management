import apiClient from './client';
import type { Sprint, SprintCreate } from '../types';

export const sprintsApi = {
  list: async (projectId: string): Promise<Sprint[]> => {
    const res = await apiClient.get(`/projects/${projectId}/sprints`);
    return res.data;
  },

  create: async (projectId: string, data: SprintCreate): Promise<Sprint> => {
    const res = await apiClient.post(`/projects/${projectId}/sprints`, data);
    return res.data;
  },

  get: async (sprintId: string): Promise<Sprint> => {
    const res = await apiClient.get(`/sprints/${sprintId}`);
    return res.data;
  },

  update: async (sprintId: string, data: Partial<SprintCreate>): Promise<Sprint> => {
    const res = await apiClient.put(`/sprints/${sprintId}`, data);
    return res.data;
  },

  start: async (sprintId: string): Promise<Sprint> => {
    const res = await apiClient.post(`/sprints/${sprintId}/start`);
    return res.data;
  },

  complete: async (sprintId: string, move_to_backlog = true): Promise<Sprint> => {
    const res = await apiClient.post(`/sprints/${sprintId}/complete`, {
      move_incomplete_to_backlog: move_to_backlog,
    });
    return res.data;
  },

  addIssue: async (sprintId: string, issueId: string): Promise<void> => {
    await apiClient.post(`/sprints/${sprintId}/issues`, { issue_id: issueId });
  },

  removeIssue: async (sprintId: string, issueId: string): Promise<void> => {
    await apiClient.delete(`/sprints/${sprintId}/issues/${issueId}`);
  },
};
