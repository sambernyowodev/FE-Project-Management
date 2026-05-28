import { useQuery, useMutation } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
import type { GenerateInvoiceRequest } from '../types';

export const useGetInvoices = () => {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: billingApi.getInvoices,
  });
};

export const useGetBillingPreview = (dto: GenerateInvoiceRequest, enabled: boolean) => {
  return useQuery({
    queryKey: ['billing', 'preview', dto],
    queryFn: () => billingApi.getPreview(dto),
    enabled: enabled,
  });
};

export const useCreateInvoice = () => {
  return useMutation({
    mutationFn: (dto: GenerateInvoiceRequest) => billingApi.createInvoice(dto),
  });
};
