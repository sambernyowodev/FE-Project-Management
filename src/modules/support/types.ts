import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type SupportTicket = Entity<'SupportTicketResponseDto'> & {
  projectName?: string;
  projectId?: string;
  masterProject?: {
    id: string;
    name: string;
    projectCode: string;
  } | null;
  assignees?: SupportTicketAssignee[];
  companyId?: string | null;
  departmentId?: string | null;
  businessOwnerId?: string | null;
  company?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string } | null;
  businessOwner?: { id: string; name: string; title?: string | null } | null;
};

export type SupportTicketAssignee = Entity<'SupportTicketAssigneeResponseDto'> & {
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    isActive: boolean;
  } | null;
  role?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

export type CreateSupportTicketAssignee = Schema<'CreateSupportTicketAssigneeDto'>;
export type UpdateSupportTicketAssignee = Schema<'UpdateSupportTicketAssigneeDto'>;

export type CreateSupportTicket = Schema<'CreateSupportTicketDto'>;
export type UpdateSupportTicket = Partial<CreateSupportTicket> & {
  hoursSpent?: number;
  status?: string;
  notes?: string;
};


