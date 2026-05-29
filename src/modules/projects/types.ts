import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type Project = Entity<'ProjectResponseDto'> & {
  name: string;
  description?: string;
  platform?: string;
  projectCode: string;
};
export type ProjectMember = Entity<'ProjectMemberResponseDto'>;
export type ProjectActivity = Entity<'ProjectActivityResponseDto'>;

export type CreateProject = Schema<'CreateProjectDto'>;
export type UpdateProject = Partial<CreateProject>;

export type CreateProjectActivity = Schema<'CreateProjectActivityDto'>;
export type UpdateProjectActivity = Partial<CreateProjectActivity>;
