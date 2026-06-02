import { supabase } from '@/shared/api/supabase';
import type { RoleRate } from '../types';

const mapRoleRate = (r: any): RoleRate => ({
  id: r.id,
  roleId: r.role_id,
  ratePerMandayProject: Number(r.rate_per_manday_project),
  ratePerMandaySupport: Number(r.rate_per_manday_support),
  currency: r.currency,
  isActive: r.is_active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  createdBy: r.created_by,
  updatedBy: r.updated_by,
  role: r.roles ? {
    id: r.roles.id,
    code: r.roles.code,
    name: r.roles.name,
  } : undefined,
} as any);

export const roleRatesApi = {
  getRoleRates: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: RoleRate[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let query = supabase
      .from('role_rates')
      .select('*, roles!inner(*)', { count: 'exact' });

    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (key === 'isActive') {
              query = query.eq('is_active', val === 'true' || val === true);
            } else if (key === 'role.name') {
              query = query.ilike('roles.name', `%${val}%`);
            } else if (key === 'ratePerMandayProject') {
              query = query.eq('rate_per_manday_project', Number(val));
            } else if (key === 'ratePerMandaySupport') {
              query = query.eq('rate_per_manday_support', Number(val));
            }
          }
        });
      } catch (e) {
        console.error('Error parsing filter params', e);
      }
    }

    if (params?.sort) {
      const isDesc = params.sort.startsWith('-');
      const col = isDesc ? params.sort.substring(1) : params.sort;
      const dbCol = col === 'ratePerMandayProject' ? 'rate_per_manday_project' : col === 'ratePerMandaySupport' ? 'rate_per_manday_support' : col === 'isActive' ? 'is_active' : col;
      query = query.order(dbCol, { ascending: !isDesc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const page = params?.page || 1;
    const perPage = params?.perPage || 10;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    let result = (data || []).map(mapRoleRate);
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      result = result.filter(r => 
        (r.role?.name || '').toLowerCase().includes(searchLower) || 
        (r.role?.code || '').toLowerCase().includes(searchLower)
      );
    }

    const total = count || result.length;
    const totalPages = Math.ceil(total / perPage);

    return {
      data: result,
      meta: {
        total,
        page,
        perPage,
        totalPages
      }
    };
  },

  getRoleRateById: async (id: string): Promise<RoleRate> => {
    const { data, error } = await supabase
      .from('role_rates')
      .select('*, roles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapRoleRate(data);
  },

  createRoleRate: async (data: Omit<RoleRate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'role' | 'project'>): Promise<RoleRate> => {
    const { data: newRate, error } = await supabase
      .from('role_rates')
      .insert({
        role_id: data.roleId,
        rate_per_manday_project: data.ratePerMandayProject,
        rate_per_manday_support: data.ratePerMandaySupport,
        currency: data.currency,
        is_active: data.isActive,
      })
      .select('*, roles(*)')
      .single();

    if (error) throw error;
    return mapRoleRate(newRate);
  },

  updateRoleRate: async (id: string, data: Partial<Omit<RoleRate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'role' | 'project'>>): Promise<RoleRate> => {
    const { data: updatedRate, error } = await supabase
      .from('role_rates')
      .update({
        role_id: data.roleId,
        rate_per_manday_project: data.ratePerMandayProject,
        rate_per_manday_support: data.ratePerMandaySupport,
        currency: data.currency,
        is_active: data.isActive,
      })
      .eq('id', id)
      .select('*, roles(*)')
      .single();

    if (error) throw error;
    return mapRoleRate(updatedRate);
  },

  deleteRoleRate: async (id: string): Promise<any> => {
    const { error } = await supabase
      .from('role_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Role rate deleted successfully' };
  },
};
