import type { Schema } from '@/shared/lib/api-helpers';

export type SupportTicket = Schema<'SupportTicketResponseDto'>
export type SupportTicketAssignee = Schema<'SupportTicketAssigneeResponseDto'>;
export type CreateSupportTicketAssignee = Schema<'CreateSupportTicketAssigneeDto'>;
export type UpdateSupportTicketAssignee = Schema<'UpdateSupportTicketAssigneeDto'>;

export type CreateSupportTicket = Schema<'CreateSupportTicketDto'>;
export type UpdateSupportTicket = Partial<CreateSupportTicket>

