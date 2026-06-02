import { supabase } from '@/shared/api/supabase';
import type { User, CreateUser, UpdateUser } from '../types';

const mapUser = (m: any): User => ({
  id: m.id,
  email: m.email,
  fullName: m.full_name,
  employeeId: m.employee_id || '',
  avatarUrl: m.avatar_url || '',
  isActive: m.is_active,
  createdAt: m.created_at,
  updatedAt: m.updated_at,
  roles: m.member_roles ? m.member_roles.map((ur: any) => ur.role || ur.roles) : [],
} as any);

export const usersApi = {
  getUsers: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: User[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let query = supabase
      .from('members')
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, member_roles(role:roles(code, name))', { count: 'exact' });

    if (params?.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (key === 'isActive') {
              query = query.eq('is_active', val === 'true' || val === true);
            } else if (key === 'employeeId') {
              query = query.ilike('employee_id', `%${val}%`);
            } else if (key === 'fullName') {
              query = query.ilike('full_name', `%${val}%`);
            } else if (key === 'email') {
              query = query.ilike('email', `%${val}%`);
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
      const dbCol = col === 'fullName' ? 'full_name' : col === 'employeeId' ? 'employee_id' : col === 'isActive' ? 'is_active' : col === 'createdAt' ? 'created_at' : col;
      query = query.order(dbCol, { ascending: !isDesc });
    } else {
      query = query.order('full_name', { ascending: true });
    }

    const page = params?.page || 1;
    const perPage = params?.perPage || 10;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / perPage);

    return {
      data: (data || []).map(mapUser),
      meta: {
        total,
        page,
        perPage,
        totalPages
      }
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('members')
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, member_roles(role:roles(code, name))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapUser(data);
  },

  createUser: async (data: CreateUser): Promise<User> => {
    const employeeId = data.employeeId || `EMP-${data.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 50);

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        email: data.email,
        full_name: data.fullName,
        employee_id: employeeId,
        is_active: true,
      })
      .select()
      .single();

    if (memberError) throw memberError;

    // Assign a default DEV_BE role if roles are not configured
    const { data: devRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'DEV_BE')
      .maybeSingle();

    if (devRole && member) {
      await supabase.from('member_roles').insert({
        member_id: member.id,
        role_id: devRole.id,
      });
    }

    // Refetch mapped user with role
    return usersApi.getUserById(member.id);
  },

  updateUser: async (id: string, data: UpdateUser): Promise<User> => {
    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        full_name: data.fullName,
        employee_id: data.employeeId,
        is_active: data.isActive,
      })
      .eq('id', id)
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, member_roles(role:roles(code, name))')
      .single();

    if (error) throw error;
    return mapUser(updatedMember);
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('members')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};
