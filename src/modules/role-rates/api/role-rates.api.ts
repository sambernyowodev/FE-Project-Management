import { apiClient } from '@/shared/api/api-client';
import type { RoleRate } from '../types';

export const roleRatesApi = {
  getRoleRates: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: RoleRate[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: RoleRate[]; meta?: any }>('/role-rates', { params });
    return response.data;
  },
};
