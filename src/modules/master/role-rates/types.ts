import type { Entity } from '@/shared/lib/api-helpers';

export type RoleRate = Omit<Entity<'RoleRateResponseDto'>, 'roleId'> & {
  roleId: string;
};

