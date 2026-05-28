import { useQuery } from '@tanstack/react-query';
import { roleRatesApi } from '../api/role-rates.api';

export const useGetRoleRates = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['role-rates', params],
    queryFn: () => roleRatesApi.getRoleRates(params),
  });
};
