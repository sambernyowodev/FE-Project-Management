import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessOwnersApi } from '../api/businessOwners.api';
import type { CreateBusinessOwnerDto, UpdateBusinessOwnerDto } from '../types';

export const useGetBusinessOwners = (params?: { departmentId?: string; companyId?: string }) => {
  return useQuery({
    queryKey: ['business-owners', params],
    queryFn: () => businessOwnersApi.getBusinessOwners(params),
  });
};

export const useGetBusinessOwner = (id: string) => {
  return useQuery({
    queryKey: ['business-owners', id],
    queryFn: () => businessOwnersApi.getBusinessOwnerById(id),
    enabled: !!id,
  });
};

export const useCreateBusinessOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBusinessOwnerDto) => businessOwnersApi.createBusinessOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
    },
  });
};

export const useUpdateBusinessOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBusinessOwnerDto }) => businessOwnersApi.updateBusinessOwner(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
      queryClient.invalidateQueries({ queryKey: ['business-owners', variables.id] });
    },
  });
};

export const useDeleteBusinessOwner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessOwnersApi.deleteBusinessOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-owners'] });
    },
  });
};
