import { apiClient } from '@/shared/api/api-client';
import type { ProjectActivity, CreateProjectActivity, UpdateProjectActivity } from '../types';

export const projectActivitiesApi = {
  getActivitiesByProject: async (projectId: number): Promise<ProjectActivity[]> => {
    const response = await apiClient.get<{ data: ProjectActivity[] }>(`/project-activities/project/${projectId}`);
    return response.data.data;
  },

  createActivity: async (data: CreateProjectActivity): Promise<ProjectActivity> => {
    const response = await apiClient.post<{ data: ProjectActivity }>('/project-activities', data);
    return response.data.data;
  },

  updateActivity: async (id: number, data: UpdateProjectActivity): Promise<ProjectActivity> => {
    const response = await apiClient.put<{ data: ProjectActivity }>(`/project-activities/${id}`, data);
    return response.data.data;
  },

  deleteActivity: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-activities/${id}`);
  },

  updateActivityProgress: async (id: number, progressPct: number): Promise<ProjectActivity> => {
    const response = await apiClient.patch<{ data: ProjectActivity }>(`/project-activities/${id}/progress`, {
      progressPct
    });
    return response.data.data;
  }
};
