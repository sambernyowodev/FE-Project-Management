import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleRatesApi } from '../api/role-rates.api';

export const useGetRoleRates = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['role-rates', params],
    queryFn: () => roleRatesApi.getRoleRates(params),
  });
};

export const useGetRoleRate = (id: number) => {
  return useQuery({
    queryKey: ['role-rates', id],
    queryFn: () => roleRatesApi.getRoleRateById(id),
    enabled: !!id,
  });
};

export const useCreateRoleRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roleRatesApi.createRoleRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-rates'] });
    },
  });
};

export const useUpdateRoleRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => roleRatesApi.updateRoleRate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-rates'] });
      queryClient.invalidateQueries({ queryKey: ['role-rates', variables.id] });
    },
  });
};

export const useDeleteRoleRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roleRatesApi.deleteRoleRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-rates'] });
    },
  });
};
