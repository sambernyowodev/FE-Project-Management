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

export const useUnassignMemberActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { memberId: string; activityId: string }) =>
      usersApi.unassignMemberActivity(variables.activityId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useUnassignAllMemberActivities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => usersApi.unassignAllMemberActivities(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', memberId] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useReassignProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMemberId, toMemberId, projectId }: { fromMemberId: string; toMemberId: string; projectId: string }) =>
      usersApi.reassignProjectMember(fromMemberId, toMemberId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.fromMemberId] });
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.toMemberId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useReassignSupportTicketMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMemberId, toMemberId, ticketId }: { fromMemberId: string; toMemberId: string; ticketId: string }) =>
      usersApi.reassignSupportTicketMember(fromMemberId, toMemberId, ticketId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.fromMemberId] });
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.toMemberId] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-assignees', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useReassignActivityMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { fromMemberId: string; toMemberId: string; activityId: string }) =>
      usersApi.reassignActivityMember(variables.toMemberId, variables.activityId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.fromMemberId] });
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.toMemberId] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

export const useReassignAllMemberRelations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMemberId, toMemberId }: { fromMemberId: string; toMemberId: string }) =>
      usersApi.reassignAllMemberRelations(fromMemberId, toMemberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.fromMemberId] });
      queryClient.invalidateQueries({ queryKey: ['member-relations', variables.toMemberId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
      queryClient.invalidateQueries({ queryKey: ['resource-management'] });
      queryClient.invalidateQueries({ queryKey: ['resource-workload-map'] });
    },
  });
};

