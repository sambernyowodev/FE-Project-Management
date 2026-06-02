import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type MasterProject = Entity<'MasterProjectResponseDto'>;
export type CreateMasterProject = Schema<'CreateMasterProjectDto'>;
export type UpdateMasterProject = Partial<CreateMasterProject>;

