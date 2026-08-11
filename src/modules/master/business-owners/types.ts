import type { Department } from '../departments/types';

export interface BusinessOwner {
  id: string;
  departmentId: string;
  department?: Department;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type CreateBusinessOwnerDto = Omit<BusinessOwner, 'id' | 'department' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateBusinessOwnerDto = Partial<CreateBusinessOwnerDto>;
