import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
import type { GenerateBillingRequest } from '../types';

export const useGetBillings = (params?: any) => {
  return useQuery({
    queryKey: ['billing', 'list', params],
    queryFn: () => billingApi.getBillings(params),
  });
};

export const useGetBillingById = (id: number) => {
  return useQuery({
    queryKey: ['billing', 'detail', id],
    queryFn: () => billingApi.getBillingById(id),
    enabled: !!id,
  });
};

export const useGetBillingPreview = (dto: GenerateBillingRequest, enabled: boolean) => {
  return useQuery({
    queryKey: ['billing', 'preview', dto],
    queryFn: () => billingApi.getPreview(dto),
    enabled: enabled,
  });
};

export const useCreateBilling = () => {
  return useMutation({
    mutationFn: (dto: GenerateBillingRequest) => billingApi.createBilling(dto),
  });
};

export const useDeleteBilling = () => {
  return useMutation({
    mutationFn: (id: number) => billingApi.deleteBilling(id),
  });
};
