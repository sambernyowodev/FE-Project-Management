import type { Entity } from '@/shared/lib/api-helpers';

export type PurchaseOrder = Entity<'PurchaseOrderResponseDto'> & {
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

