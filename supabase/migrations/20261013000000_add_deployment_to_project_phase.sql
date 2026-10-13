-- Migration: Add DEPLOYMENT to project_phase enum
-- Date: 2026-10-13

ALTER TYPE public.project_phase ADD VALUE IF NOT EXISTS 'DEPLOYMENT';
