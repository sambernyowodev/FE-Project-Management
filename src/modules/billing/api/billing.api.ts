import { apiClient } from '@/shared/api/api-client';
import type { BillingInvoice } from '../types';
import type { components } from '@/shared/types/api';

type GenerateInvoiceDto = components['schemas']['GenerateInvoiceDto'];

export const billingApi = {
  getInvoices: async (): Promise<BillingInvoice[]> => {
    const response = await apiClient.get<{ data: BillingInvoice[] }>('/billing/invoices');
    return response.data.data;
  },

  getPreview: async (dto: GenerateInvoiceDto): Promise<any> => {
    const response = await apiClient.post<{ data: any }>('/billing/preview', dto);
    return response.data.data;
  },

  createInvoice: async (dto: GenerateInvoiceDto): Promise<BillingInvoice> => {
    const response = await apiClient.post<{ data: BillingInvoice }>('/billing/invoice', dto);
    return response.data.data;
  }
};
