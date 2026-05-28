import type { Schema } from '@/shared/lib/api-helpers';

export type MasterProject = Schema<'MasterProjectResponseDto'>;
export type CreateMasterProject = Schema<'CreateMasterProjectDto'>;
export type UpdateMasterProject = Partial<CreateMasterProject>;
