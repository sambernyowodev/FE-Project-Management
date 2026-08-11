export interface Company {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type CreateCompanyDto = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateCompanyDto = Partial<CreateCompanyDto>;
