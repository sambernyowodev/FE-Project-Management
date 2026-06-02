-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums matching backend
CREATE TYPE project_status AS ENUM (
  'PLANNING', 
  'IN PROGRESS', 
  'SIT', 
  'UAT', 
  'CLOSED', 
  'ON HOLD', 
  'CANCELLED', 
  'FUT'
);

CREATE TYPE project_phase AS ENUM (
  'FCAB', 
  'REQUIREMENT', 
  'ANALYSIS', 
  'DESIGN', 
  'SRS', 
  'CRQ', 
  'DEVELOPMENT', 
  'UT SIT', 
  'TRA TC', 
  'REVIEW', 
  'SIT', 
  'UAT', 
  'NFT', 
  'SECURITY', 
  'RFS', 
  'FUT'
);

CREATE TYPE purchase_order_status AS ENUM (
  'DRAFT', 
  'ACTIVE', 
  'IN PROGRESS', 
  'COMPLETED', 
  'CLOSED', 
  'CANCELLED'
);

CREATE TYPE support_ticket_status AS ENUM (
  'OPEN', 
  'IN PROGRESS', 
  'DEV DONE', 
  'SIT DONE', 
  'UAT DONE', 
  'DONE', 
  'ON HOLD', 
  'CANCELLED'
);

CREATE TYPE support_ticket_detail_status AS ENUM (
  'OPEN', 
  'IN PROGRESS', 
  'DONE', 
  'ON HOLD'
);

CREATE TYPE invoice_status AS ENUM (
  'DRAFT', 
  'SENT', 
  'PAID', 
  'OVERDUE', 
  'CANCELLED'
);

CREATE TYPE billing_status AS ENUM (
  'DRAFT', 
  'FINALIZED', 
  'CANCELLED'
);

-- 2. Create Roles Table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- 3. Create Members Table (mapped to auth.users)
CREATE TABLE public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- 4. Create User Roles Junction Table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  CONSTRAINT uk_member_role UNIQUE (member_id, role_id)
);

-- 5. Helper Function to Check Admin Role (RLS bypass)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.member_id = user_id AND r.code = 'ADMIN'
  );
$$ LANGUAGE sql;

-- 6. Create Master Projects Table
CREATE TABLE public.master_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 7. Create Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.master_projects(id) ON DELETE CASCADE,
  pic_client VARCHAR(255),
  customer VARCHAR(255),
  pic_internal VARCHAR(255),
  parent_project_id UUID REFERENCES public.projects(id),
  status project_status DEFAULT 'PLANNING'::project_status NOT NULL,
  total_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  start_date DATE,
  end_date DATE,
  actual_start DATE,
  actual_end DATE,
  progress_pct DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  repository_link VARCHAR(500),
  timeline_link VARCHAR(500),
  remarks TEXT,
  timeline_remark TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 8. Create Project Members Table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  assigned_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  actual_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT uk_project_member_role UNIQUE (project_id, member_id, role_id)
);

-- 9. Create Project Activities Table
CREATE TABLE public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_activities(id) ON DELETE SET NULL,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  feature VARCHAR(255),
  sub_feature VARCHAR(255),
  details TEXT,
  duration_days INTEGER DEFAULT 0 NOT NULL,
  mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  start_date DATE,
  end_date DATE,
  actual_start DATE,
  actual_end DATE,
  progress_pct DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  phase project_phase DEFAULT 'DEVELOPMENT'::project_phase NOT NULL,
  assigned_to UUID REFERENCES public.members(id),
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_milestone BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 10. Create Purchase Orders Table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(100) UNIQUE NOT NULL,
  po_name VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  description TEXT,
  total_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  status purchase_order_status DEFAULT 'DRAFT'::purchase_order_status NOT NULL,
  start_date DATE,
  end_date DATE,
  remarks TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 11. Create Po Projects Table
CREATE TABLE public.po_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  allocated_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT uk_po_project UNIQUE (po_id, project_id)
);

-- 12. Create Po Members Table
CREATE TABLE public.po_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  project_member_id UUID NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  actual_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  actual_hours DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  rate_per_manday DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  total_cost DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  start_date DATE,
  end_date DATE,
  is_billable BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 13. Create Role Rates Table
CREATE TABLE public.role_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  rate_per_manday_project DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  rate_per_manday_support DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 14. Create Billings Table
CREATE TABLE public.billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_number VARCHAR(100) UNIQUE NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  total_amount DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  status billing_status DEFAULT 'DRAFT'::billing_status NOT NULL,
  remarks TEXT,
  billing_type VARCHAR(50) DEFAULT 'PROJECT' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 15. Create Billing Projects Table
CREATE TABLE public.billing_projects (
  billing_id UUID NOT NULL REFERENCES public.billings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  PRIMARY KEY (billing_id, project_id)
);

-- 16. Create Billing Details Table
CREATE TABLE public.billing_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id UUID NOT NULL REFERENCES public.billings(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  rate_per_manday DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  subtotal DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 17. Create Support Tickets Table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  master_project_id UUID REFERENCES public.master_projects(id) ON DELETE SET NULL,
  customer VARCHAR(255),
  pic_client VARCHAR(255),
  issue_title VARCHAR(500) NOT NULL,
  issue_description TEXT,
  hours_spent DECIMAL(6, 2) DEFAULT 0 NOT NULL,
  mandays_spent DECIMAL(6, 2) DEFAULT 0 NOT NULL,
  status support_ticket_status DEFAULT 'OPEN'::support_ticket_status NOT NULL,
  start_date DATE,
  end_date DATE,
  folder_attachment VARCHAR(500),
  notes TEXT,
  update_date DATE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 18. Create Support Ticket Assignees Table
CREATE TABLE public.support_ticket_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  hours_spent DECIMAL(6, 2) DEFAULT 0 NOT NULL,
  status support_ticket_detail_status DEFAULT 'OPEN'::support_ticket_detail_status NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 19. RLS Setup
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_assignees ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Generator Macro
-- READ: Allow authenticated users to view all
CREATE POLICY "Allow read for authenticated" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.master_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.project_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.po_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.po_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.role_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.billings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.billing_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.billing_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.support_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.support_ticket_assignees FOR SELECT TO authenticated USING (true);

-- WRITE (INSERT, UPDATE, DELETE): Only Admins can execute
CREATE POLICY "Allow write for admin" ON public.roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.members FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.master_projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.project_members FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.project_activities FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.purchase_orders FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.po_projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.po_members FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.role_rates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.billings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.billing_projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.billing_details FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.support_tickets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Allow write for admin" ON public.support_ticket_assignees FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 20. Trigger for Auto-profile syncing on Supabase User signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, full_name, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
