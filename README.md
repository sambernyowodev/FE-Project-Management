# HCM Project Management - Frontend Portal (Backendless)

This is the React 19 + Vite + TypeScript frontend repository for the **HCM Project Management Application**, utilizing a fully **backendless architecture** powered directly by **Supabase**.

---

## 🚀 Current Project Status

The application is **fully migrated and production-ready**. 
- **Backendless Architecture**: The project communicates directly with Supabase via `@supabase/supabase-js` for authentication, database actions, and security policies.
- **Code Cleanliness**: 100% clean compilation (`tsc`) and linter (`eslint`). All unused modules and legacy Axios client codes have been pruned.
- **Completed Modules**: Dashboard, Projects, Gantt Timeline, Support Tickets, Purchase Orders, Billing/Invoice Wizard, Role Rates, and Reports.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **State & Data Fetching**: TanStack React Query v5 & `@supabase/supabase-js` client
- **Styling**: Tailwind CSS v4 (using CSS-based configuration in `index.css`)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Charts**: Recharts
- **Excel Export**: SheetJS (`xlsx`)
- **Date Utilities**: `date-fns`

---

## 📁 Project Structure

```
FE Project Management/
├── dist/                   # Production build outputs
├── public/                 # Static assets (favicon.svg)
├── scripts/                # Database seed and generation scripts
│   ├── data.ts             # Raw data for seeding
│   └── seed-supabase.ts    # Node.js seed script for Supabase
├── supabase/               # Supabase CLI and database schema migrations
│   ├── config.toml         # Supabase configuration
│   └── migrations/         # PostgreSQL schema files
├── src/
│   ├── app/                # Application initialization (providers, router)
│   │   ├── providers/      # React Query Provider, etc.
│   │   └── router/         # Application router and layout configurations
│   ├── assets/             # Asset files
│   ├── features/           # Feature pages (Auth, Billing, Dashboard, Master, Projects, POs, Reports, Support)
│   ├── modules/            # Hooks, API calls, and types scoped by feature
│   ├── shared/             # Reusable global components, helpers, constants, and types
│   │   ├── api/            # API client config (Supabase client initialization)
│   │   ├── components/     # Shared UI (DataTable, Layout, Sidebar, Topbar, StatusBadge)
│   │   ├── constants/      # Shared constants & enums
│   │   ├── lib/            # Shared utilities (formatters, excel helpers)
│   │   └── types/          # Shared type definitions
│   ├── index.css           # Global styling and custom scrollbars
│   └── main.tsx            # App entry point
├── eslint.config.js        # Linter configuration
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_SECRET_KEY=your-service-role-key-here
```
> [!IMPORTANT]
> - `VITE_SUPABASE_PUBLISHABLE_KEY` is used by the client for regular operations.
> - `SUPABASE_SECRET_KEY` is a service role key. It is **only** required locally for running the database seeder to bypass Row Level Security (RLS) and programmatically provision authentication users. Keep it safe and never expose it in production!

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database Schema & Seeder
If you are linking a remote Supabase project, execute the following commands:
```bash
# Link the local CLI with your Supabase remote project
npx supabase link --project-ref <your-project-ref>

# Push the database schema & migrations (RLS, Triggers, Tables)
npx supabase db push

# Seed the initial project data
npx tsx scripts/seed-supabase.ts
```

### 3. Run Development Server
```bash
npm run dev
```
The application will run locally at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
This builds and checks for TypeScript compilation errors, outputting production-ready static assets to the `dist` folder.

---

## 📝 Supabase Database Schema Context (Reference)

*Below is the database schema, Postgres ENUMs, triggers, and Row Level Security (RLS) setup for the backendless Supabase architecture.*

<details>
<summary><b>Click to expand PostgreSQL Schema, Policies & Triggers</b></summary>

### 1. Custom Postgres ENUMs
```sql
CREATE TYPE project_status AS ENUM ('PLANNING', 'IN PROGRESS', 'SIT', 'UAT', 'CLOSED', 'ON HOLD', 'CANCELLED', 'FUT');
CREATE TYPE project_phase AS ENUM ('FCAB', 'REQUIREMENT', 'ANALYSIS', 'DESIGN', 'SRS', 'CRQ', 'DEVELOPMENT', 'UT SIT', 'TRA TC', 'REVIEW', 'SIT', 'UAT', 'NFT', 'SECURITY', 'RFS', 'FUT');
CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'ACTIVE', 'IN PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED');
CREATE TYPE support_ticket_status AS ENUM ('OPEN', 'IN PROGRESS', 'DEV DONE', 'SIT DONE', 'UAT DONE', 'DONE', 'ON HOLD', 'CANCELLED');
CREATE TYPE support_ticket_detail_status AS ENUM ('OPEN', 'IN PROGRESS', 'DONE', 'ON HOLD');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE billing_status AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED');
```

### 2. Main Tables & Relations
```sql
-- Roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Members (Project Resources / Staff profiles)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Member Roles Junction
CREATE TABLE public.member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  CONSTRAINT uk_member_role UNIQUE (member_id, role_id)
);

-- App Users (Portal logins / Admins - Linked 1-to-1 with auth.users)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'ADMIN' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Master Projects
CREATE TABLE public.master_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.master_projects(id) ON DELETE CASCADE,
  pic_client VARCHAR(255),
  customer VARCHAR(255),
  status project_status DEFAULT 'PLANNING'::project_status NOT NULL,
  total_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  start_date DATE,
  end_date DATE,
  repository_link VARCHAR(500),
  timeline_link VARCHAR(500),
  remarks TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Project Members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  assigned_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  actual_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  CONSTRAINT uk_project_member_role UNIQUE (project_id, member_id, role_id)
);

-- Project Activities (Tasks)
CREATE TABLE public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_activities(id) ON DELETE SET NULL,
  activity_name VARCHAR(255) NOT NULL,
  duration_days INTEGER DEFAULT 0 NOT NULL,
  mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  start_date DATE,
  end_date DATE,
  progress_pct DECIMAL(5, 2) DEFAULT 0 NOT NULL,
  phase project_phase DEFAULT 'DEVELOPMENT'::project_phase NOT NULL,
  assigned_to UUID REFERENCES public.members(id),
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_milestone BOOLEAN DEFAULT FALSE NOT NULL
);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(100) UNIQUE NOT NULL,
  po_name VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  description TEXT,
  total_mandays DECIMAL(8, 2) DEFAULT 0 NOT NULL,
  status purchase_order_status DEFAULT 'DRAFT'::purchase_order_status NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  master_project_id UUID REFERENCES public.master_projects(id) ON DELETE SET NULL,
  customer VARCHAR(255),
  issue_title VARCHAR(500) NOT NULL,
  hours_spent DECIMAL(6, 2) DEFAULT 0 NOT NULL,
  status support_ticket_status DEFAULT 'OPEN'::support_ticket_status NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);
```

### 3. Row Level Security & Policies
All tables have RLS enabled. Since only portal administrators/authorized users can log in to the Supabase Auth system, any authenticated session is granted select and write capabilities:
```sql
CREATE POLICY "Allow read for authenticated" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for authenticated" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 4. Admin Auth Sync Trigger
A PostgreSQL trigger runs automatically on new user registration in Supabase Auth to provision their administrator profile into `public.app_users` with a default role of `'ADMIN'`:
```sql
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
```

</details>