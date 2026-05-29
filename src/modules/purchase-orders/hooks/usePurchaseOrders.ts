import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poApi } from '../api/po.api';

export const useGetPurchaseOrders = (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => poApi.getPurchaseOrders(params),
  });
};

export const useGetPurchaseOrder = (id: number | undefined) => {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => poApi.getPurchaseOrder(id!),
    enabled: !!id,
  });
};

export const useGetProjectsWithoutPO = () => {
  return useQuery({
    queryKey: ['projects-without-po'],
    queryFn: () => poApi.getProjectsWithoutPO(),
  });
};

export const useGetPurchaseOrdersByProject = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['purchase-orders', 'project', projectId],
    queryFn: () => poApi.getPurchaseOrdersByProject(projectId!),
    enabled: !!projectId,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: poApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ poName: string; customer: string; totalMandays: number; totalAmount: number; description?: string; startDate?: string; endDate?: string }> }) =>
      poApi.updatePurchaseOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: poApi.deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['projects-without-po'] });
    },
  });
};

export const useAddProjectToPO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, data }: { poId: number; data: { projectId: number; allocatedMandays: number; remarks?: string } }) =>
      poApi.addProjectToPO(poId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['projects-without-po'] });
    },
  });
};

export const useRemoveProjectFromPO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, projectId }: { poId: number; projectId: number }) =>
      poApi.removeProjectFromPO(poId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['projects-without-po'] });
    },
  });
};

export const useGetPOMembers = (poId: number | undefined) => {
  return useQuery({
    queryKey: ['po-members', poId],
    queryFn: () => poApi.getPOMembers(poId!),
    enabled: !!poId,
  });
};

export const useAssignPOMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: poApi.assignPOMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['po-members', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.poId] });
    },
  });
};

export const useUpdatePOMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any; poId: number }) => poApi.updatePOMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['po-members', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.poId] });
    },
  });
};

export const useRemovePOMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, poId }: { id: number; poId: number }) => poApi.removePOMember(id).then(() => poId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['po-members', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.poId] });
    },
  });
};
