import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectActivitiesApi } from '../api/project-activities.api';
import type { CreateProjectActivity, UpdateProjectActivity } from '../types';

export const useGetProjectActivities = (projectId: number) => {
  return useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => projectActivitiesApi.getActivitiesByProject(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProjectActivity = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectActivity) => projectActivitiesApi.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProjectActivity = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectActivity }) =>
      projectActivitiesApi.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProjectActivity = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectActivitiesApi.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateActivityProgress = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progressPct }: { id: number; progressPct: number }) =>
      projectActivitiesApi.updateActivityProgress(id, progressPct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
