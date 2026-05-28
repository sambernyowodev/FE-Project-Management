import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/shared/components/layout/Layout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProjectListPage } from '@/features/projects/ProjectListPage';
import { ProjectFormPage } from '@/features/projects/ProjectFormPage';
import { ProjectTimelinePage } from '@/features/projects/ProjectTimelinePage';
import { POListPage } from '@/features/purchase-orders/POListPage';
import { SOListPage } from '@/features/sales-orders/SOListPage';
import { SupportListPage } from '@/features/support/SupportListPage';
import { SupportFormPage } from '@/features/support/SupportFormPage';
import { BillingHubPage } from '@/features/billing/BillingHubPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { RoleRateListPage } from '@/features/role-rates/RoleRateListPage';
import { MemberListPage } from '@/features/members/MemberListPage';
import { MemberFormPage } from '@/features/members/MemberFormPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: 'projects',
        element: <ProjectListPage />
      },
      {
        path: 'projects/new',
        element: <ProjectFormPage />
      },
      {
        path: 'projects/:id',
        element: <ProjectFormPage />
      },
      {
        path: 'projects/:id/timeline',
        element: <ProjectTimelinePage />
      },
      {
        path: 'timeline',
        element: <ProjectTimelinePage />
      },
      {
        path: 'purchase-orders',
        element: <POListPage />
      },
      {
        path: 'sales-orders',
        element: <SOListPage />
      },
      {
        path: 'support',
        element: <SupportListPage />
      },
      {
        path: 'support/new',
        element: <SupportFormPage />
      },
      {
        path: 'support/:id',
        element: <SupportFormPage />
      },
      {
        path: 'members',
        element: <MemberListPage />
      },
      {
        path: 'members/new',
        element: <MemberFormPage />
      },
      {
        path: 'members/:id',
        element: <MemberFormPage />
      },
      {
        path: 'billing',
        element: <BillingHubPage />
      },
      {
        path: 'reports',
        element: <ReportsPage />
      },
      {
        path: 'settings',
        element: <RoleRateListPage />
      }
    ]
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      }
    ]
  },
  {
    path: '*',
    element: <div>Page not found</div>
  }
]);
