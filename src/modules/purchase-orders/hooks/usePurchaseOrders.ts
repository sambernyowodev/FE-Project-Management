import { useQuery } from '@tanstack/react-query';
import { poApi } from '../api/po.api';

export const useGetPurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: poApi.getPurchaseOrders,
  });
};

export const useGetPurchaseOrdersByProject = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['purchase-orders', 'project', projectId],
    queryFn: () => poApi.getPurchaseOrdersByProject(projectId!),
    enabled: !!projectId,
  });
};
