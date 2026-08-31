import apiClient from './client';
import type { Workflow } from '../types';

interface WorkflowCreate {
  name: string;
  trigger: string;
  conditions?: unknown[];
  actions?: unknown[];
  enabled?: boolean;
  project_id: string;
}

interface WorkflowUpdate {
  name?: string;
  conditions?: unknown[];
  actions?: unknown[];
  enabled?: boolean;
}

export const workflowsApi = {
  list: async (projectId: string): Promise<Workflow[]> => {
    const res = await apiClient.get(`/projects/${projectId}/workflows`);
    return res.data;
  },

  create: async (projectId: string, data: WorkflowCreate): Promise<Workflow> => {
    const res = await apiClient.post(`/projects/${projectId}/workflows`, data);
    return res.data;
  },

  update: async (projectId: string, workflowId: string, data: WorkflowUpdate): Promise<Workflow> => {
    const res = await apiClient.put(`/projects/${projectId}/workflows/${workflowId}`, data);
    return res.data;
  },

  delete: async (projectId: string, workflowId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/workflows/${workflowId}`);
  },
};
