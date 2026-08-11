-- Migration: Customer Master Data (Company -> Department -> Business Owner)
-- Date: 2026-08-12

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT uk_company_department_name UNIQUE (company_id, name)
);

-- 3. Create Business Owners Table
CREATE TABLE IF NOT EXISTS public.business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. Add foreign key columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_owner_id UUID REFERENCES public.business_owners(id) ON DELETE SET NULL;

-- 5. Add foreign key columns to support_tickets table
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_owner_id UUID REFERENCES public.business_owners(id) ON DELETE SET NULL;

-- 5b. Add foreign key columns to purchase_orders table
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 6. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_business_owners_department ON public.business_owners(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_department ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_business_owner ON public.projects(business_owner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_department ON public.support_tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_owner ON public.support_tickets(business_owner_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_department ON public.purchase_orders(department_id);

-- 7. Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_owners ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Allow read for authenticated" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.business_owners FOR SELECT TO authenticated USING (true);

-- Write policies for authenticated users (matching project pattern)
DROP POLICY IF EXISTS "Allow write for admin" ON public.companies;
DROP POLICY IF EXISTS "Allow write for admin" ON public.departments;
DROP POLICY IF EXISTS "Allow write for admin" ON public.business_owners;

CREATE POLICY "Allow write for authenticated" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for authenticated" ON public.business_owners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Seed Data & Auto Migration
DO $$
DECLARE
  v_telkomsel_id UUID;
  v_hcm_id UUID;
  v_it_id UUID;
  r RECORD;
  v_bo_id UUID;
BEGIN
  -- Insert Company Telkomsel if not exists
  SELECT id INTO v_telkomsel_id FROM public.companies WHERE UPPER(code) = 'TELKOMSEL' OR UPPER(name) = 'TELKOMSEL' LIMIT 1;
  IF v_telkomsel_id IS NULL THEN
    INSERT INTO public.companies (code, name) VALUES ('TELKOMSEL', 'Telkomsel') RETURNING id INTO v_telkomsel_id;
  END IF;

  -- Insert Department HCM if not exists
  SELECT id INTO v_hcm_id FROM public.departments WHERE company_id = v_telkomsel_id AND UPPER(name) = 'HCM' LIMIT 1;
  IF v_hcm_id IS NULL THEN
    INSERT INTO public.departments (company_id, name, description) VALUES (v_telkomsel_id, 'HCM', 'Human Capital Management') RETURNING id INTO v_hcm_id;
  END IF;

  -- Insert Department IT if not exists
  SELECT id INTO v_it_id FROM public.departments WHERE company_id = v_telkomsel_id AND UPPER(name) = 'IT' LIMIT 1;
  IF v_it_id IS NULL THEN
    INSERT INTO public.departments (company_id, name, description) VALUES (v_telkomsel_id, 'IT', 'Information Technology') RETURNING id INTO v_it_id;
  END IF;

  -- Auto-migrate distinct pic_client values from projects & support_tickets to business_owners under Telkomsel/HCM
  FOR r IN (
    SELECT DISTINCT TRIM(pic_client) AS client_name
    FROM (
      SELECT pic_client FROM public.projects WHERE pic_client IS NOT NULL AND TRIM(pic_client) <> ''
      UNION
      SELECT pic_client FROM public.support_tickets WHERE pic_client IS NOT NULL AND TRIM(pic_client) <> ''
    ) combined
  ) LOOP
    SELECT id INTO v_bo_id FROM public.business_owners WHERE department_id = v_hcm_id AND LOWER(name) = LOWER(r.client_name) LIMIT 1;
    IF v_bo_id IS NULL THEN
      INSERT INTO public.business_owners (department_id, name) VALUES (v_hcm_id, r.client_name) RETURNING id INTO v_bo_id;
    END IF;
  END LOOP;

  -- Link existing projects to Telkomsel + HCM + business owner
  UPDATE public.projects p
  SET 
    company_id = v_telkomsel_id,
    department_id = v_hcm_id,
    business_owner_id = bo.id
  FROM public.business_owners bo
  WHERE p.pic_client IS NOT NULL 
    AND TRIM(p.pic_client) <> '' 
    AND LOWER(bo.name) = LOWER(TRIM(p.pic_client))
    AND bo.department_id = v_hcm_id
    AND p.company_id IS NULL;

  -- Fallback for projects with customer text filled but no pic_client match
  UPDATE public.projects
  SET company_id = v_telkomsel_id, department_id = v_hcm_id
  WHERE company_id IS NULL AND (customer IS NOT NULL AND TRIM(customer) <> '');

  -- Link existing support_tickets to Telkomsel + HCM + business owner
  UPDATE public.support_tickets st
  SET 
    company_id = v_telkomsel_id,
    department_id = v_hcm_id,
    business_owner_id = bo.id
  FROM public.business_owners bo
  WHERE st.pic_client IS NOT NULL 
    AND TRIM(st.pic_client) <> '' 
    AND LOWER(bo.name) = LOWER(TRIM(st.pic_client))
    AND bo.department_id = v_hcm_id
    AND st.company_id IS NULL;

  -- Fallback for support tickets
  UPDATE public.support_tickets
  SET company_id = v_telkomsel_id, department_id = v_hcm_id
  WHERE company_id IS NULL AND (customer IS NOT NULL AND TRIM(customer) <> '');

END $$;
