import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectActivitiesApi } from '../api/project-activities.api';
import type { CreateProjectActivity, UpdateProjectActivity } from '../types';

export const useGetProjectActivities = (projectId: string) => {
  return useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => projectActivitiesApi.getActivitiesByProject(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProjectActivity = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectActivity) => projectActivitiesApi.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProjectActivity = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectActivity }) =>
      projectActivitiesApi.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProjectActivity = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectActivitiesApi.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateActivityProgress = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progressPct }: { id: string; progressPct: number }) =>
      projectActivitiesApi.updateActivityProgress(id, progressPct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useBulkImportActivities = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mode,
      newActivities,
      updateActivities
    }: {
      mode: 'append' | 'replace' | 'upsert';
      newActivities: CreateProjectActivity[];
      updateActivities?: { id: string; data: UpdateProjectActivity }[];
    }) => {
      if (mode === 'replace') {
        await projectActivitiesApi.deleteAllProjectActivities(projectId);
        if (newActivities.length > 0) {
          await projectActivitiesApi.bulkCreateActivities(newActivities);
        }
      } else if (mode === 'upsert') {
        if (updateActivities && updateActivities.length > 0) {
          await projectActivitiesApi.bulkUpdateActivities(updateActivities);
        }
        if (newActivities.length > 0) {
          await projectActivitiesApi.bulkCreateActivities(newActivities);
        }
      } else {
        // append
        if (newActivities.length > 0) {
          await projectActivitiesApi.bulkCreateActivities(newActivities);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
