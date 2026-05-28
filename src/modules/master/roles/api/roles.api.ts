import { apiClient } from '@/shared/api/api-client';
import type { Role } from '../types';

export const rolesApi = {
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<{ data: Role[] }>('/roles');
    return response.data.data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await apiClient.get<{ data: Role }>(`/roles/${id}`);
    return response.data.data;
  },

  createRole: async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Role> => {
    const response = await apiClient.post<{ data: Role }>('/roles', data);
    return response.data.data;
  },

  updateRole: async (id: number, data: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<Role> => {
    const response = await apiClient.put<{ data: Role }>(`/roles/${id}`, data);
    return response.data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};
