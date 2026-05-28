import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/roles.api';

export const useGetRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getRoles(),
  });
};

export const useGetRole = (id: number) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getRoleById(id),
    enabled: !!id,
  });
};
