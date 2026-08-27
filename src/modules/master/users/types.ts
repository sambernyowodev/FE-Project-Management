import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type User = Entity<'UserResponseDto'>;
export type CreateUser = Omit<Schema<'CreateUserDto'>, 'password'> & {
  password?: string;
};
export type UpdateUser = Schema<'UpdateUserDto'>;

export interface MemberProjectRelation {
  id: string; // project_members id
  projectId: string;
  projectCode: string;
  projectName: string;
  status: string;
  roleName: string;
  assignedMandays: number;
}

export interface MemberSupportRelation {
  id: string; // support_ticket_assignees id
  ticketId: string;
  ticketCode: string;
  issueTitle: string;
  status: string;
  roleName: string;
}

export interface MemberRelationsData {
  memberId: string;
  projects: MemberProjectRelation[];
  supports: MemberSupportRelation[];
  activityCount: number;
}

