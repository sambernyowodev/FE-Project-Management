import { apiClient } from '@/shared/api/api-client';
import type { PurchaseOrder } from '../types';

export const poApi = {
  getPurchaseOrders: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: PurchaseOrder[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: PurchaseOrder[]; meta?: any }>('/purchase-orders', { params });
    return response.data;
  },

  getPurchaseOrder: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`);
    return response.data.data;
  },

  createPurchaseOrder: async (data: { poName: string; customer: string; totalMandays: number; totalAmount: number; description?: string; startDate?: string; endDate?: string }): Promise<PurchaseOrder> => {
    const response = await apiClient.post<{ data: PurchaseOrder }>('/purchase-orders', data);
    return response.data.data;
  },

  updatePurchaseOrder: async (id: number, data: Partial<{ poName: string; customer: string; totalMandays: number; totalAmount: number; description?: string; startDate?: string; endDate?: string }>): Promise<PurchaseOrder> => {
    const response = await apiClient.put<{ data: PurchaseOrder }>(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  deletePurchaseOrder: async (id: number): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },

  addProjectToPO: async (poId: number, data: { projectId: number; allocatedMandays: number; remarks?: string }): Promise<void> => {
    await apiClient.post(`/purchase-orders/${poId}/projects`, data);
  },

  removeProjectFromPO: async (poId: number, projectId: number): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${poId}/projects/${projectId}`);
  },

  getPurchaseOrdersByProject: async (projectId: number): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<{ data: PurchaseOrder[] }>(`/purchase-orders/project/${projectId}`);
    return response.data.data;
  },

  getProjectsWithoutPO: async (): Promise<any[]> => {
    const response = await apiClient.get<{ data: any[] }>('/purchase-orders/without-po');
    return response.data.data;
  },

  getPOMembers: async (poId: number): Promise<any[]> => {
    const response = await apiClient.get<{ data: any[] }>(`/po-members/po/${poId}`);
    return response.data.data;
  },

  assignPOMember: async (data: { poId: number; projectMemberId: number; roleId: number; actualMandays?: number; actualHours?: number }): Promise<any> => {
    const response = await apiClient.post<{ data: any }>('/po-members', data);
    return response.data.data;
  },

  updatePOMember: async (id: number, data: { actualMandays: number }): Promise<any> => {
    const response = await apiClient.put<{ data: any }>(`/po-members/${id}/actuals`, data);
    return response.data.data;
  },

  removePOMember: async (id: number): Promise<void> => {
    await apiClient.delete(`/po-members/${id}`);
  }
};

