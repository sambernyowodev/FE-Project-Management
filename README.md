# HCM Project Management - Frontend Portal

This is the React 19 + Vite + TypeScript frontend repository for the **HCM Project Management Application**.

---

## 🚀 Current Project Status

The frontend application is **fully implemented** and production-ready.
- **Code Cleanliness**: 100% clean linter (`eslint`) and compilation (`tsc`). All unused files, imports, and variables have been pruned.
- **Key Modules**: Dashboard, Projects, Gantt Timeline, Support Tickets, Purchase Orders, Billing/Invoice Wizard, Role Rates, and Reports.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (using CSS-based configuration in `index.css`)
- **State & Data Fetching**: TanStack React Query v5 & Axios (with authorization interceptors)
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
├── src/
│   ├── app/                # Application initialization (providers, router)
│   │   ├── providers/      # React Query Provider, etc.
│   │   └── router/         # Application router and layout configurations
│   ├── assets/             # Asset files
│   ├── features/           # Feature pages (Auth, Billing, Dashboard, Master, Projects, POs, Reports, Support)
│   ├── modules/            # Hooks, API calls, and types scoped by feature
│   ├── shared/             # Reusable global components, helpers, constants, and types
│   │   ├── api/            # API client config (Axios client)
│   │   ├── components/     # Shared UI (DataTable, Layout, Sidebar, Topbar, StatusBadge)
│   │   ├── constants/      # Shared constants
│   │   ├── lib/            # Shared utilities (formatters, excel helpers)
│   │   └── types/          # Shared type definitions (API types)
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
VITE_API_URL=http://localhost:3000/api
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will run locally at `http://localhost:5173`.

### 3. Run Linter
```bash
npm run lint
```

### 4. Build for Production
```bash
npm run build
```
This builds and checks for TypeScript compilation errors, outputting production-ready static assets to the `dist` folder.

---

## 📝 Full-Stack System Context (Reference)

*Below is the original full-stack specification, database schema, and NestJS backend architecture for the HCM Project Management App.*

<details>
<summary><b>Click to expand Database Schema & NestJS Backend Reference</b></summary>

### 1. Database Schema

```sql
-- Users & Authentication
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_role (user_id, role_id)
);

-- Role Rates
CREATE TABLE role_rates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NULL,
    rate_per_manday DECIMAL(12,2) NOT NULL DEFAULT 0,
    rate_per_hour DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    effective_from DATE NOT NULL,
    effective_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_project_effective (role_id, project_id, effective_from)
);

-- Projects
CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pic_client VARCHAR(255),
    platform VARCHAR(100),
    status ENUM('PLANNING','IN_PROGRESS','SIT','UAT','CLOSED','ON_HOLD','CANCELLED') DEFAULT 'PLANNING',
    total_mandays DECIMAL(8,2) DEFAULT 0,
    start_date DATE, end_date DATE,
    actual_start DATE, actual_end DATE,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    customer VARCHAR(255),
    repository_link VARCHAR(500),
    timeline_link VARCHAR(500),
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Project Members (MULTI-ROLE: primary + secondary)
CREATE TABLE project_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    secondary_role_id BIGINT UNSIGNED NULL,
    assigned_mandays DECIMAL(8,2) DEFAULT 0,
    actual_mandays DECIMAL(8,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (secondary_role_id) REFERENCES roles(id)
);

-- Project Activities (Timeline/Gantt)
CREATE TABLE project_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    activity_name VARCHAR(255) NOT NULL,
    description TEXT,
    feature VARCHAR(255), sub_feature VARCHAR(255), details TEXT,
    duration_days INT DEFAULT 0, mandays DECIMAL(8,2) DEFAULT 0,
    start_date DATE, end_date DATE,
    actual_start DATE, actual_end DATE,
    progress_pct DECIMAL(5,2) DEFAULT 0,
    phase ENUM('FCAB','REQUIREMENT','ANALYSIS','DESIGN','SRS','CRQ','DEVELOPMENT','UT_SIT','TRA_TC','REVIEW','SIT','UAT','NFT','SECURITY','RFS','FUT') DEFAULT 'DEVELOPMENT',
    assigned_to BIGINT UNSIGNED NULL,
    sort_order INT DEFAULT 0,
    is_milestone BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES project_activities(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Purchase Orders (PO)
CREATE TABLE purchase_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    po_name VARCHAR(255) NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    customer VARCHAR(255) NOT NULL,
    description TEXT,
    total_mandays DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('DRAFT','ACTIVE','IN_PROGRESS','COMPLETED','CLOSED','CANCELLED') DEFAULT 'DRAFT',
    start_date DATE, end_date DATE,
    signed_date DATE,
    document_url VARCHAR(500),
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sales Orders (SO - child of PO)
CREATE TABLE sales_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    so_number VARCHAR(100) NOT NULL UNIQUE,
    so_name VARCHAR(255) NOT NULL,
    po_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    description TEXT,
    total_mandays DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('DRAFT','ACTIVE','IN_PROGRESS','DELIVERED','INVOICED','PAID','CLOSED','CANCELLED') DEFAULT 'DRAFT',
    start_date DATE, end_date DATE,
    delivery_date DATE, invoice_date DATE, payment_date DATE,
    document_url VARCHAR(500),
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Support Tickets
CREATE TABLE support_tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    project_id BIGINT UNSIGNED NULL,
    project_name VARCHAR(255) NOT NULL,
    pic_client VARCHAR(255),
    issue_title VARCHAR(500) NOT NULL,
    issue_description TEXT,
    hours_spent DECIMAL(6,2) DEFAULT 0,
    mandays_spent DECIMAL(6,2) DEFAULT 0,
    status ENUM('OPEN','IN_PROGRESS','DEV_DONE','SIT_DONE','UAT_DONE','DONE','ON_HOLD','CANCELLED') DEFAULT 'OPEN',
    platform VARCHAR(100),
    start_date DATE, end_date DATE,
    business_analyst_id BIGINT UNSIGNED NULL,
    ui_ux_id BIGINT UNSIGNED NULL,
    dev_fe_id BIGINT UNSIGNED NULL,
    dev_be_id BIGINT UNSIGNED NULL,
    folder_attachment VARCHAR(500),
    notes TEXT,
    update_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (business_analyst_id) REFERENCES users(id),
    FOREIGN KEY (ui_ux_id) REFERENCES users(id),
    FOREIGN KEY (dev_fe_id) REFERENCES users(id),
    FOREIGN KEY (dev_be_id) REFERENCES users(id)
);

-- Billing Invoices
CREATE TABLE billing_invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    po_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_mandays DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    status ENUM('DRAFT','SENT','PAID','OVERDUE','CANCELLED') DEFAULT 'DRAFT',
    invoice_date DATE, due_date DATE, paid_date DATE,
    document_url VARCHAR(500),
    remarks TEXT,
    created_by BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 2. NestJS Backend Structure

```
src/
├── app.module.ts
├── main.ts
├── config/
│   ├── database.config.ts
│   └── app.config.ts
├── modules/
│   ├── auth/            # JWT Auth, Login, Register, Profile
│   ├── users/           # User management
│   ├── roles/           # System roles
│   ├── role-rates/      # Global & Project-Specific Rates override
│   ├── projects/        # Projects CRUD & Members (multi-role)
│   ├── purchase-orders/ # PO workflow & auto-numbering
│   ├── sales-orders/    # SO workflow & PO references
│   ├── support-tickets/ # Support ticket log and sub-issues
│   └── billing/         # Automated invoice calculations & exports
```

### 3. Planned Backend API Endpoints

```
Auth:
  POST /api/auth/login
  POST /api/auth/register
  GET  /api/auth/me

Role Rates:
  GET    /api/role-rates
  GET    /api/role-rates/project/:projectId
  POST   /api/role-rates

Projects:
  GET    /api/projects
  POST   /api/projects
  PUT    /api/projects/:id
  GET    /api/projects/:id/members

Billing:
  POST   /api/billing/generate-preview
  POST   /api/billing/create-invoice
  GET    /api/billing/invoices
  GET    /api/billing/invoices/:id/download
```

</details>