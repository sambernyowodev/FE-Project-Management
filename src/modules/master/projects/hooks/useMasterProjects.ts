import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterProjectsApi } from '../api/projects.api';

export const useGetMasterProjects = (params?: {
  page?: number;
  perPage?: number;
  sort?: string;
  search?: string;
  filter?: string;
}) => {
  return useQuery({
    queryKey: ['master-projects', params],
    queryFn: () => masterProjectsApi.getMasterProjects(params),
  });
};

export const useGetMasterProject = (id: number) => {
  return useQuery({
    queryKey: ['master-projects', id],
    queryFn: () => masterProjectsApi.getMasterProjectById(id),
    enabled: !!id,
  });
};

export const useCreateMasterProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterProjectsApi.createMasterProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
    },
  });
};

export const useUpdateMasterProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      masterProjectsApi.updateMasterProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
      queryClient.invalidateQueries({ queryKey: ['master-projects', variables.id] });
    },
  });
};

export const useDeleteMasterProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: masterProjectsApi.deleteMasterProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-projects'] });
    },
  });
};
