import type { Schema } from '@/shared/lib/api-helpers';

export type SupportTicket = Schema<'SupportTicketResponseDto'> & {
  projectName: string;
  projectId: number;
  picClient?: string;
};
export type CreateSupportTicket = Schema<'CreateSupportTicketDto'>;
export type UpdateSupportTicket = Partial<CreateSupportTicket> & {
  picClient?: string;
  hoursSpent?: number;
  mandaysSpent?: number;
  status?: string;
  notes?: string;
};
