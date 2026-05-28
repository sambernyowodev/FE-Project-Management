import { useQuery } from '@tanstack/react-query';
import { soApi } from '../api/so.api';

export const useGetSalesOrders = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => soApi.getSalesOrders(params),
  });
};
