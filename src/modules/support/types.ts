import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type SupportTicket = Entity<'SupportTicketResponseDto'>
export type SupportTicketAssignee = Entity<'SupportTicketAssigneeResponseDto'>;
export type CreateSupportTicketAssignee = Schema<'CreateSupportTicketAssigneeDto'>;
export type UpdateSupportTicketAssignee = Schema<'UpdateSupportTicketAssigneeDto'>;

export type CreateSupportTicket = Schema<'CreateSupportTicketDto'>;
export type UpdateSupportTicket = Partial<CreateSupportTicket> & {
  hoursSpent?: number;
  status?: string;
  notes?: string;
};


