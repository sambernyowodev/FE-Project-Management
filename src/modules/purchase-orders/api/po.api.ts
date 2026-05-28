import { apiClient } from '@/shared/api/api-client';
import type { PurchaseOrder } from '../types';

export const poApi = {
  getPurchaseOrders: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: PurchaseOrder[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: PurchaseOrder[]; meta?: any }>('/purchase-orders', { params });
    return response.data;
  },
  
  getPurchaseOrdersByProject: async (projectId: number): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<{ data: PurchaseOrder[] }>(`/purchase-orders/project/${projectId}`);
    return response.data.data;
  }
};
