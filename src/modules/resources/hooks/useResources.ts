import { useQuery } from '@tanstack/react-query';
import { resourcesApi } from '../api/resources.api';
import type { ResourceFilterParams } from '../types';

export const useGetResourceManagement = (params?: ResourceFilterParams) => {
  return useQuery({
    queryKey: ['resource-management', params],
    queryFn: () => resourcesApi.getResources(params),
  });
};

export const useGetResourceWorkloadMap = () => {
  return useQuery({
    queryKey: ['resource-workload-map'],
    queryFn: () => resourcesApi.getWorkloadMap(),
  });
};
