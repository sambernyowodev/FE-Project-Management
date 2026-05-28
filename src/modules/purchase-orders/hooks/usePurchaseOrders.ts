import { useQuery } from '@tanstack/react-query';
import { poApi } from '../api/po.api';

export const useGetPurchaseOrders = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => poApi.getPurchaseOrders(params),
  });
};

export const useGetPurchaseOrdersByProject = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['purchase-orders', 'project', projectId],
    queryFn: () => poApi.getPurchaseOrdersByProject(projectId!),
    enabled: !!projectId,
  });
};
