import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type Project = Entity<'ProjectResponseDto'> & {
  name: string;
  description?: string;
  platform?: string;
  projectCode: string;
};
export type ProjectMember = Omit<Entity<'ProjectMemberResponseDto'>, 'projectId' | 'userId' | 'roleId'> & {
  projectId: string;
  memberId: string;
  roleId: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  } | null;
  role?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  } | null;
};

export type ProjectActivity = Omit<Entity<'ProjectActivityResponseDto'>, 'projectId' | 'parentId' | 'assignedToId'> & {
  projectId: string;
  parentId?: string | null;
  assignedToId?: string | null;
};

export type CreateProject = Schema<'CreateProjectDto'>;
export type UpdateProject = Partial<CreateProject>;

export type CreateProjectActivity = Schema<'CreateProjectActivityDto'>;
export type UpdateProjectActivity = Partial<CreateProjectActivity>;
