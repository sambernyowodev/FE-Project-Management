import { apiClient } from '@/shared/api/api-client';
import type { Project } from '../types';
import type { components } from '@/shared/types/api';

type CreateProjectDto = components['schemas']['CreateProjectDto'];
type UpdateProjectDto = Partial<CreateProjectDto> & { status?: string, timelineRemark?: string, startDate?: string, endDate?: string };


export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<{ data: Project[] }>('/projects');
    return response.data.data;
  },
  
  getProjectById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<{ data: Project }>(`/projects/${id}`);
    return response.data.data;
  },
  
  createProject: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<{ data: Project }>('/projects', data);
    return response.data.data;
  },

  updateProject: async (id: number, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.put<{ data: Project }>(`/projects/${id}`, data);
    return response.data.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  }
};
