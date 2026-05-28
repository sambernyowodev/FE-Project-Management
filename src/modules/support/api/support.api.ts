import { apiClient } from '@/shared/api/api-client';
import type { SupportTicket, CreateSupportTicket, UpdateSupportTicket } from '../types';

export const supportApi = {
  getTickets: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: SupportTicket[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const response = await apiClient.get<{ data: SupportTicket[]; meta?: any }>('/support-tickets', { params });
    return response.data;
  },
  
  getTicketById: async (id: number): Promise<SupportTicket> => {
    const response = await apiClient.get<{ data: SupportTicket }>(`/support-tickets/${id}`);
    return response.data.data;
  },

  createTicket: async (data: CreateSupportTicket): Promise<SupportTicket> => {
    const response = await apiClient.post<{ data: SupportTicket }>('/support-tickets', data);
    return response.data.data;
  },

  updateTicket: async (id: number, data: UpdateSupportTicket): Promise<SupportTicket> => {
    const response = await apiClient.put<{ data: SupportTicket }>(`/support-tickets/${id}`, data);
    return response.data.data;
  },

  deleteTicket: async (id: number): Promise<void> => {
    await apiClient.delete(`/support-tickets/${id}`);
  }
};
