import apiClient from './client';
import type { ProjectSummary, VelocityReport, BurndownReport } from '../types';

export const reportsApi = {
  summary: async (projectId: string): Promise<ProjectSummary> => {
    const res = await apiClient.get(`/projects/${projectId}/reports/summary`);
    return res.data;
  },

  velocity: async (projectId: string): Promise<VelocityReport> => {
    const res = await apiClient.get(`/projects/${projectId}/reports/velocity`);
    return res.data;
  },

  burndown: async (projectId: string, sprintId?: string): Promise<BurndownReport> => {
    const params = sprintId ? { sprint_id: sprintId } : {};
    const res = await apiClient.get(`/projects/${projectId}/reports/burndown`, { params });
    return res.data;
  },
};
