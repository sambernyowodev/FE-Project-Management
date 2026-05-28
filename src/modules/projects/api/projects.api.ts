import { apiClient } from '@/shared/api/api-client';
import type { Project, ProjectMember } from '../types';
import type { components } from '@/shared/types/api';
import type { CreateProject, UpdateProject } from '../types';

export const projectsApi = {
  getProjects: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: Project[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: Project[]; meta?: any }>('/projects', { params });
    return response.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<{ data: Project }>(`/projects/${id}`);
    return response.data.data;
  },

  createProject: async (data: CreateProject): Promise<Project> => {
    const response = await apiClient.post<{ data: Project }>('/projects', data);
    return response.data.data;
  },

  updateProject: async (id: number, data: UpdateProject): Promise<Project> => {
    const response = await apiClient.put<{ data: Project }>(`/projects/${id}`, data);
    return response.data.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getProjectMembers: async (projectId: number): Promise<ProjectMember[]> => {
    const response = await apiClient.get<{ data: ProjectMember[] }>(`/projects/${projectId}/members`);
    return response.data.data;
  },

  addProjectMember: async (projectId: number, data: components['schemas']['AddProjectMemberDto']): Promise<ProjectMember> => {
    const response = await apiClient.post<{ data: ProjectMember }>(`/projects/${projectId}/members`, data);
    return response.data.data;
  }
};
