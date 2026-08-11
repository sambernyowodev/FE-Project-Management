import type { Entity } from '@/shared/lib/api-helpers';

export type PurchaseOrder = Entity<'PurchaseOrderResponseDto'> & {
  companyId?: string | null;
  departmentId?: string | null;
  company?: {
    id: string;
    code: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  allocatedMandays: number;
  remainingMandays: number;
  poProjects?: Array<{
    id: string;
    poId: string;
    projectId: string;
    allocatedMandays: number;
    remarks: string | null;
    project?: {
      id: string;
      project?: {
        name: string;
      };
    };
  }>;
};

