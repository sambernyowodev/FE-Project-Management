import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export const useGetProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });
};

export const useGetProject = (id: number) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => projectsApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
