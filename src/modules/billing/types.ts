import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type Billing = Entity<'BillingResponseDto'>;
export type GenerateBillingRequest = Schema<'GenerateBillingDto'>;