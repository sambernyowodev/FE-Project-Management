import { useQuery } from '@tanstack/react-query';
import { supportApi } from '../api/support.api';

export const useGetSupportTickets = () => {
  return useQuery({
    queryKey: ['support-tickets'],
    queryFn: supportApi.getTickets,
  });
};

export const useGetSupportTicket = (id: number) => {
  return useQuery({
    queryKey: ['support-tickets', id],
    queryFn: () => supportApi.getTicketById(id),
    enabled: !!id,
  });
};
