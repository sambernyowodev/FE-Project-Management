import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type Billing = Entity<'BillingResponseDto'>;
export type GenerateBillingRequest = Omit<Schema<'GenerateBillingDto'>, 'projectIds' | 'supportTicketIds'> & {
  projectIds?: string[];
  supportTicketIds?: string[];
};