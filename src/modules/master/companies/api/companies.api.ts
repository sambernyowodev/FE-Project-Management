import { supabase } from '@/shared/api/supabase';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../types';

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
    const { data, error } = await supabase
      .from('companies')
      .insert({
        code: dto.code,
        name: dto.name,
        address: dto.address,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCompany(data);
  },

  updateCompany: async (id: string, dto: UpdateCompanyDto): Promise<Company> => {
    const payload: any = {};
    if (dto.code !== undefined) payload.code = dto.code;
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.address !== undefined) payload.address = dto.address;
    if (dto.isActive !== undefined) payload.is_active = dto.isActive;

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
