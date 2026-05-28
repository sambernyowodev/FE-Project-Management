import { apiClient } from '@/shared/api/api-client';
import type { PurchaseOrder } from '../types';

export const poApi = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<{ data: PurchaseOrder[] }>('/purchase-orders');
    return response.data.data;
  },
  
  getPurchaseOrdersByProject: async (projectId: number): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<{ data: PurchaseOrder[] }>(`/purchase-orders/project/${projectId}`);
    return response.data.data;
  }
};
