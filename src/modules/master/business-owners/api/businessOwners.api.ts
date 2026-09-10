import { supabase } from '@/shared/api/supabase';
import type { BusinessOwner, CreateBusinessOwnerDto, UpdateBusinessOwnerDto } from '../types';
import { withAuditCreated, withAuditUpdated } from '@/shared/utils/audit';

const mapBusinessOwner = (b: any): BusinessOwner => ({
  id: b.id,
  departmentId: b.department_id,
  department: b.department ? {
    id: b.department.id,
    companyId: b.department.company_id,
    company: b.department.company ? {
      id: b.department.company.id,
      code: b.department.company.code,
      name: b.department.company.name,
      address: b.department.company.address,
      isActive: b.department.company.is_active,
      createdAt: b.department.company.created_at,
      updatedAt: b.department.company.updated_at,
    } : undefined,
    name: b.department.name,
    description: b.department.description,
    isActive: b.department.is_active,
    createdAt: b.department.created_at,
    updatedAt: b.department.updated_at,
  } : undefined,
  name: b.name,
  title: b.title || '',
  email: b.email || '',
  phone: b.phone || '',
  isActive: b.is_active ?? true,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
  createdBy: b.created_by,
  updatedBy: b.updated_by,
});

export const businessOwnersApi = {
  getBusinessOwners: async (params?: { departmentId?: string; companyId?: string }): Promise<BusinessOwner[]> => {
    let query = supabase
      .from('business_owners')
      .select('*, department:departments(*, company:companies(*))')
      .order('name', { ascending: true });

    if (params?.departmentId) {
      query = query.eq('department_id', params.departmentId);
    } else if (params?.companyId) {
      query = query.eq('department.company_id', params.companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapBusinessOwner);
  },

  getBusinessOwnerById: async (id: string): Promise<BusinessOwner> => {
    const { data, error } = await supabase
      .from('business_owners')
      .select('*, department:departments(*, company:companies(*))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapBusinessOwner(data);
  },

  createBusinessOwner: async (dto: CreateBusinessOwnerDto): Promise<BusinessOwner> => {
    const payload = await withAuditCreated({
      department_id: dto.departmentId,
      name: dto.name,
      title: dto.title,
      email: dto.email,
      phone: dto.phone,
      is_active: dto.isActive ?? true,
    });

    const { data, error } = await supabase
      .from('business_owners')
      .insert(payload)
      .select('*, department:departments(*, company:companies(*))')
      .single();

    if (error) throw error;
    return mapBusinessOwner(data);
  },

  updateBusinessOwner: async (id: string, dto: UpdateBusinessOwnerDto): Promise<BusinessOwner> => {
    const rawPayload: any = {};
    if (dto.departmentId !== undefined) rawPayload.department_id = dto.departmentId;
    if (dto.name !== undefined) rawPayload.name = dto.name;
    if (dto.title !== undefined) rawPayload.title = dto.title;
    if (dto.email !== undefined) rawPayload.email = dto.email;
    if (dto.phone !== undefined) rawPayload.phone = dto.phone;
    if (dto.isActive !== undefined) rawPayload.is_active = dto.isActive;

    const payload = await withAuditUpdated(rawPayload);

    const { data, error } = await supabase
      .from('business_owners')
      .update(payload)
      .eq('id', id)
      .select('*, department:departments(*, company:companies(*))')
      .maybeSingle();

    if (error) throw error;
    if (!data) return businessOwnersApi.getBusinessOwnerById(id);
    return mapBusinessOwner(data);
  },

  deleteBusinessOwner: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('business_owners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
