-- Migration: Automated audit triggers for created_by and updated_by
-- This migration ensures that database-level inserts and updates automatically populate
-- created_by and updated_by using auth.uid() if not explicitly provided.

CREATE OR REPLACE FUNCTION public.set_audit_columns_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  IF NEW.updated_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_audit_columns_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to key tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'master_projects',
    'projects',
    'support_tickets',
    'purchase_orders',
    'project_activities',
    'project_members',
    'billings',
    'billing_details',
    'companies',
    'departments',
    'business_owners',
    'roles',
    'role_rates',
    'master_holidays',
    'members'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_insert_%I ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_insert_%I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns_on_insert();', t, t);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_update_%I ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_audit_columns_on_update();', t, t);
  END LOOP;
END;
$$;
