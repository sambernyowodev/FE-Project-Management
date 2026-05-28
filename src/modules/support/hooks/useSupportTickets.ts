import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../api/support.api';
import type { CreateSupportTicket, UpdateSupportTicket } from '../types';

export const useGetSupportTickets = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => supportApi.getTickets(params),
  });
};

export const useGetSupportTicket = (id: number) => {
  return useQuery({
    queryKey: ['support-tickets', id],
    queryFn: () => supportApi.getTicketById(id),
    enabled: !!id,
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupportTicket) => supportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupportTicket }) => 
      supportApi.updateTicket(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', variables.id] });
    },
  });
};

export const useDeleteSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => supportApi.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};
