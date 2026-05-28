import { apiClient } from '@/shared/api/api-client';
import type { MasterProject, CreateMasterProject, UpdateMasterProject } from '../types';

export const masterProjectsApi = {
  getMasterProjects: async (params?: {
    page?: number;
    perPage?: number;
    sort?: string;
    search?: string;
    filter?: string;
  }): Promise<{
    data: MasterProject[];
    meta?: { total: number; page: number; perPage: number; totalPages: number };
  }> => {
    const response = await apiClient.get<{ data: MasterProject[]; meta?: any }>('/master/projects', { params });
    return response.data;
  },

  getMasterProjectById: async (id: number): Promise<MasterProject> => {
    const response = await apiClient.get<{ data: MasterProject }>(`/master/projects/${id}`);
    return response.data.data;
  },

  createMasterProject: async (data: CreateMasterProject): Promise<MasterProject> => {
    const response = await apiClient.post<{ data: MasterProject }>('/master/projects', data);
    return response.data.data;
  },

  updateMasterProject: async (id: number, data: UpdateMasterProject): Promise<MasterProject> => {
    const response = await apiClient.put<{ data: MasterProject }>(`/master/projects/${id}`, data);
    return response.data.data;
  },

  deleteMasterProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/master/projects/${id}`);
  },
};
