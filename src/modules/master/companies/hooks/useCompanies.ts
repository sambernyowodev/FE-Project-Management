import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '../api/companies.api';
import type { CreateCompanyDto, UpdateCompanyDto } from '../types';

export const useGetCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.getCompanies(),
  });
};

export const useGetCompany = (id: string) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesApi.getCompanyById(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyDto) => companiesApi.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyDto }) => companiesApi.updateCompany(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', variables.id] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};
