import { apiClient } from '@/shared/api/api-client';
import type { Billing, GenerateBillingRequest } from '../types';

export const billingApi = {
  getBillings: async (params?: any): Promise<Billing[]> => {
    const response = await apiClient.get<{ data: Billing[] }>('/billing', { params });
    return response.data.data;
  },

  getBillingById: async (id: number): Promise<Billing> => {
    const response = await apiClient.get<{ data: Billing }>(`/billing/${id}`);
    return response.data.data;
  },

  getPreview: async (dto: GenerateBillingRequest): Promise<any> => {
    const response = await apiClient.post<{ data: any }>('/billing/preview', dto);
    return response.data.data;
  },

  createBilling: async (dto: GenerateBillingRequest): Promise<Billing> => {
    const response = await apiClient.post<{ data: Billing }>('/billing', dto);
    return response.data.data;
  }
};
