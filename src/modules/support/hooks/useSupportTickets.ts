import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../api/support.api';
import type { CreateSupportTicket, UpdateSupportTicket, CreateSupportTicketAssignee, UpdateSupportTicketAssignee } from '../types';

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

// Assignee Hooks
export const useGetTicketAssignees = (ticketId: number) => {
  return useQuery({
    queryKey: ['support-ticket-assignees', ticketId],
    queryFn: () => supportApi.getTicketAssignees(ticketId),
    enabled: !!ticketId,
  });
};

export const useAddTicketAssignee = (ticketId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupportTicketAssignee) => supportApi.addTicketAssignee(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-assignees', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

export const useUpdateTicketAssignee = (ticketId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assigneeId, data }: { assigneeId: number; data: UpdateSupportTicketAssignee }) =>
      supportApi.updateTicketAssignee(ticketId, assigneeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-assignees', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};

export const useRemoveTicketAssignee = (ticketId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: number) => supportApi.removeTicketAssignee(ticketId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-assignees', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
};
