import type { Company } from '../companies/types';

export interface Department {
  id: string;
  companyId: string;
  company?: Company;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type CreateDepartmentDto = Omit<Department, 'id' | 'company' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;
