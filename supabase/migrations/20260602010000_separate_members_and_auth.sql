-- 1. Drop old policies that depend on is_admin function
DROP POLICY IF EXISTS "Allow write for admin" ON public.roles;
DROP POLICY IF EXISTS "Allow write for admin" ON public.members;
DROP POLICY IF EXISTS "Allow write for admin" ON public.user_roles;
DROP POLICY IF EXISTS "Allow write for admin" ON public.master_projects;
DROP POLICY IF EXISTS "Allow write for admin" ON public.projects;
DROP POLICY IF EXISTS "Allow write for admin" ON public.project_members;
DROP POLICY IF EXISTS "Allow write for admin" ON public.project_activities;
DROP POLICY IF EXISTS "Allow write for admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow write for admin" ON public.po_projects;
DROP POLICY IF EXISTS "Allow write for admin" ON public.po_members;
DROP POLICY IF EXISTS "Allow write for admin" ON public.role_rates;
DROP POLICY IF EXISTS "Allow write for admin" ON public.billings;
DROP POLICY IF EXISTS "Allow write for admin" ON public.billing_projects;
DROP POLICY IF EXISTS "Allow write for admin" ON public.billing_details;
DROP POLICY IF EXISTS "Allow write for admin" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow write for admin" ON public.support_ticket_assignees;

-- 2. Drop old triggers, sync functions, and the is_admin function itself
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- 3. Decouple members table from auth.users
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_id_fkey;
ALTER TABLE public.members ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Rename user_roles table to member_roles
ALTER TABLE public.user_roles RENAME TO member_roles;

-- 5. Create public.app_users table for system logins (Admins/Managers)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ADMIN' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 6. Sync trigger for auth.users to app_users
CREATE OR REPLACE FUNCTION public.handle_new_app_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'ADMIN')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_app_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_app_user();

-- 7. Recreate RLS Policies to allow all authenticated app users to manage the portal
-- Allow read/write for authenticated on app_users
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.app_users;
CREATE POLICY "Allow read for authenticated" ON public.app_users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow write for authenticated" ON public.app_users;
CREATE POLICY "Allow write for authenticated" ON public.app_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create new write policies for other tables
CREATE POLICY "Allow write for authenticated" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.member_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.master_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.project_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.project_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.po_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.po_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.role_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.billings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.billing_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.billing_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.support_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.support_ticket_assignees FOR ALL TO authenticated USING (true) WITH CHECK (true);
