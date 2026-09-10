import { supabase } from '@/shared/api/supabase';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../types';
import { withAuditCreated, withAuditUpdated } from '@/shared/utils/audit';

const mapCompany = (c: any): Company => ({
  id: c.id,
  code: c.code,
  name: c.name,
  address: c.address || '',
  isActive: c.is_active ?? true,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
  createdBy: c.created_by,
  updatedBy: c.updated_by,
});

export const companiesApi = {
  getCompanies: async (): Promise<Company[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapCompany);
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapCompany(data);
  },

  createCompany: async (dto: CreateCompanyDto): Promise<Company> => {
    const payload = await withAuditCreated({
      code: dto.code,
      name: dto.name,
      address: dto.address,
      is_active: dto.isActive ?? true,
    });

    const { data, error } = await supabase
      .from('companies')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return mapCompany(data);
  },

  updateCompany: async (id: string, dto: UpdateCompanyDto): Promise<Company> => {
    const rawPayload: any = {};
    if (dto.code !== undefined) rawPayload.code = dto.code;
    if (dto.name !== undefined) rawPayload.name = dto.name;
    if (dto.address !== undefined) rawPayload.address = dto.address;
    if (dto.isActive !== undefined) rawPayload.is_active = dto.isActive;

    const payload = await withAuditUpdated(rawPayload);

    const { data, error } = await supabase
      .from('companies')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return companiesApi.getCompanyById(id);
    return mapCompany(data);
  },

  deleteCompany: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
