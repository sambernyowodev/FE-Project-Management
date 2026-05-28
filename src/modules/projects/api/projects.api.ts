import { apiClient } from '@/shared/api/api-client';
import type { Project, ProjectMember } from '../types';
import type { components } from '@/shared/types/api';
import type { CreateProject, UpdateProject } from '../types';

const mapProject = (p: any): Project => ({
  ...p,
  name: p.project?.name || '',
  description: p.project?.description || '',
  platform: p.project?.platform || '',
  projectCode: p.project?.projectCode || `PRJ-${p.id}`,
  type: p.projectType,
});

export const projectsApi = {
  getProjects: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: Project[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: any[]; meta?: any }>('/projects', { params });
    return {
      ...response.data,
      data: (response.data.data || []).map(mapProject),
    };
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<{ data: any }>(`/projects/${id}`);
    return mapProject(response.data.data);
  },

  createProject: async (data: CreateProject): Promise<Project> => {
    const response = await apiClient.post<{ data: any }>('/projects', data);
    return mapProject(response.data.data);
  },

  updateProject: async (id: number, data: UpdateProject): Promise<Project> => {
    const response = await apiClient.put<{ data: any }>(`/projects/${id}`, data);
    return mapProject(response.data.data);
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
