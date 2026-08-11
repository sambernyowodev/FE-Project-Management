import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type Project = Entity<'ProjectResponseDto'> & {
  name: string;
  description?: string;
  platform?: string;
  projectCode: string;
  poId?: string;
  poNumber?: string;
  companyId?: string | null;
  departmentId?: string | null;
  businessOwnerId?: string | null;
  company?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string } | null;
  businessOwner?: { id: string; name: string; title?: string | null } | null;
};
export type ProjectMember = Omit<Entity<'ProjectMemberResponseDto'>, 'projectId' | 'userId' | 'roleId'> & {
  projectId: string;
  memberId: string;
  roleId: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    employeeId?: string;
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
