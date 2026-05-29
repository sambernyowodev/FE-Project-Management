import { apiClient } from '@/shared/api/api-client';
import type { SupportTicket, CreateSupportTicket, UpdateSupportTicket } from '../types';

const mapTicket = (t: any): SupportTicket => ({
  ...t,
  projectName: t.masterProject?.name || '',
  projectId: t.masterProjectId || 0,
  picClient: t.picClient || '',
  customer: t.customer || '',
});

export const supportApi = {
  getTickets: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: SupportTicket[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: any[]; meta?: any }>('/support-tickets', { params });
    return {
      ...response.data,
      data: (response.data.data || []).map(mapTicket),
    };
  },
  
  getTicketById: async (id: number): Promise<SupportTicket> => {
    const response = await apiClient.get<{ data: any }>(`/support-tickets/${id}`);
    return mapTicket(response.data.data);
  },

  createTicket: async (data: CreateSupportTicket): Promise<SupportTicket> => {
    const response = await apiClient.post<{ data: any }>('/support-tickets', data);
    return mapTicket(response.data.data);
  },

  updateTicket: async (id: number, data: UpdateSupportTicket): Promise<SupportTicket> => {
    const response = await apiClient.put<{ data: any }>(`/support-tickets/${id}`, data);
    return mapTicket(response.data.data);
  },

  deleteTicket: async (id: number): Promise<void> => {
    await apiClient.delete(`/support-tickets/${id}`);
  }
};
