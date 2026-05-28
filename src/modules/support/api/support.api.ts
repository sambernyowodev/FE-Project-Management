import { apiClient } from '@/shared/api/api-client';
import type { SupportTicket } from '../types';

export const supportApi = {
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get<{ data: SupportTicket[] }>('/support-tickets');
    return response.data.data;
  },
  
  getTicketById: async (id: number): Promise<SupportTicket> => {
    const response = await apiClient.get<{ data: SupportTicket }>(`/support-tickets/${id}`);
    return response.data.data;
  }
};
