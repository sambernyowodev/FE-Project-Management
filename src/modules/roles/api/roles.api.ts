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
};
