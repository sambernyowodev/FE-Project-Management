import { apiClient } from '@/shared/api/api-client';
import type { RoleRate } from '../types';

export const roleRatesApi = {
  getRoleRates: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: RoleRate[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: RoleRate[]; meta?: any }>('/role-rates', { params });
    return response.data;
  },

  getRoleRateById: async (id: number): Promise<RoleRate> => {
    const response = await apiClient.get<{ data: RoleRate }>(`/role-rates/${id}`);
    return response.data.data;
  },

  createRoleRate: async (data: Omit<RoleRate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'role' | 'project'>): Promise<RoleRate> => {
    const response = await apiClient.post<{ data: RoleRate }>('/role-rates', data);
    return response.data.data;
  },

  updateRoleRate: async (id: number, data: Partial<Omit<RoleRate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'role' | 'project'>>): Promise<RoleRate> => {
    const response = await apiClient.put<{ data: RoleRate }>(`/role-rates/${id}`, data);
    return response.data.data;
  },
};
