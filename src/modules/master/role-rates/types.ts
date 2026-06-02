import type { Entity } from '@/shared/lib/api-helpers';

export type RoleRate = Omit<Entity<'RoleRateResponseDto'>, 'roleId'> & {
  roleId: string;
  role?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  } | null;
};

