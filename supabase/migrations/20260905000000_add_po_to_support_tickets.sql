-- Migration: Add po_id column to support_tickets table
-- Date: 2026-09-05

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- Index for performance when filtering support tickets by PO
CREATE INDEX IF NOT EXISTS idx_support_tickets_po ON public.support_tickets(po_id);
