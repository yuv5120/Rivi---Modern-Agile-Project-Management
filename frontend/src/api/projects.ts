import apiClient from './client';
import type { Project, ProjectCreate, ProjectUpdate } from '../types';

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const res = await apiClient.get('/projects/');
    return res.data;
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const res = await apiClient.post('/projects/', data);
    return res.data;
  },

  get: async (id: string): Promise<Project> => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  update: async (id: string, data: ProjectUpdate): Promise<Project> => {
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  addMember: async (id: string, username: string, role = 'member'): Promise<void> => {
    await apiClient.post(`/projects/${id}/members`, { username, role });
  },

  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/members/${userId}`);
  },
};
