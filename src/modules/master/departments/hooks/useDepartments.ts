import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../api/departments.api';
import type { CreateDepartmentDto, UpdateDepartmentDto } from '../types';

export const useGetDepartments = (companyId?: string) => {
  return useQuery({
    queryKey: ['departments', { companyId }],
    queryFn: () => departmentsApi.getDepartments(companyId),
  });
};

export const useGetDepartment = (id: string) => {
  return useQuery({
    queryKey: ['departments', id],
    queryFn: () => departmentsApi.getDepartmentById(id),
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => departmentsApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDto }) => departmentsApi.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', variables.id] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
