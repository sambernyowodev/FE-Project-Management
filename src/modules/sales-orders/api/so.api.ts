import { apiClient } from '@/shared/api/api-client';
import type { SalesOrder } from '../types';

export const soApi = {
  getSalesOrders: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: SalesOrder[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: SalesOrder[]; meta?: any }>('/sales-orders', { params });
    return response.data;
  },
};
