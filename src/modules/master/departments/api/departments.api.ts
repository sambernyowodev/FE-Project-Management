import { supabase } from '@/shared/api/supabase';
import type { Department, CreateDepartmentDto, UpdateDepartmentDto } from '../types';

const mapDepartment = (d: any): Department => ({
  id: d.id,
  companyId: d.company_id,
  company: d.company ? {
    id: d.company.id,
    code: d.company.code,
    name: d.company.name,
    address: d.company.address,
    isActive: d.company.is_active,
    createdAt: d.company.created_at,
    updatedAt: d.company.updated_at,
  } : undefined,
  name: d.name,
  description: d.description || '',
  isActive: d.is_active ?? true,
  createdAt: d.created_at,
  updatedAt: d.updated_at,
  createdBy: d.created_by,
  updatedBy: d.updated_by,
});

export const departmentsApi = {
  getDepartments: async (companyId?: string): Promise<Department[]> => {
    let query = supabase
      .from('departments')
      .select('*, company:companies(*)')
      .order('name', { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapDepartment);
  },

  getDepartmentById: async (id: string): Promise<Department> => {
    const { data, error } = await supabase
      .from('departments')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapDepartment(data);
  },

  createDepartment: async (dto: CreateDepartmentDto): Promise<Department> => {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        company_id: dto.companyId,
        name: dto.name,
        description: dto.description,
        is_active: dto.isActive ?? true,
      })
      .select('*, company:companies(*)')
      .single();

    if (error) throw error;
    return mapDepartment(data);
  },

  updateDepartment: async (id: string, dto: UpdateDepartmentDto): Promise<Department> => {
    const payload: any = {};
    if (dto.companyId !== undefined) payload.company_id = dto.companyId;
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.isActive !== undefined) payload.is_active = dto.isActive;

    const { data, error } = await supabase
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select('*, company:companies(*)')
      .maybeSingle();

    if (error) throw error;
    if (!data) return departmentsApi.getDepartmentById(id);
    return mapDepartment(data);
  },

  deleteDepartment: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
