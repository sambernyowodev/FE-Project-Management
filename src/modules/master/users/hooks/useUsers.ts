import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';

export const useGetUsers = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params),
  });
};

export const useGetUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.toggleUserStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
      queryClient.invalidateQueries({ queryKey: ['member-relations'] });
    },
  });
};

export const useGetMemberRelations = (memberId: string | null) => {
  return useQuery({
    queryKey: ['member-relations', memberId],
    queryFn: () => usersApi.getMemberRelations(memberId!),
    enabled: Boolean(memberId),
  });
};

export const useRemoveMemberFromProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, projectId }: { memberId: string; projectId: string }) =>
      usersApi.removeMemberFromProject(memberId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useRemoveMemberFromSupport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, ticketId }: { memberId: string; ticketId: string }) =>
      usersApi.removeMemberFromSupport(memberId, ticketId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-assignees', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

