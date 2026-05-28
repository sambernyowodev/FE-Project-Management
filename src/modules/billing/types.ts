import type { Schema, Entity } from '@/shared/lib/api-helpers';

export type BillingInvoice = Entity<'BillingInvoiceResponseDto'>;
export type GenerateInvoiceRequest = Schema<'GenerateInvoiceDto'>;