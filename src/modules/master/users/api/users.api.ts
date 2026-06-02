import { supabase } from '@/shared/api/supabase';
import type { User, CreateUser, UpdateUser } from '../types';
import { createClient } from '@supabase/supabase-js';

const mapUser = (m: any): User => ({
  id: m.id,
  email: m.email,
  fullName: m.full_name,
  employeeId: m.employee_id || '',
  avatarUrl: m.avatar_url || '',
  isActive: m.is_active,
  createdAt: m.created_at,
  updatedAt: m.updated_at,
  roles: m.user_roles ? m.user_roles.map((ur: any) => ur.role || ur.roles) : [],
} as any);

export const usersApi = {
  getUsers: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: User[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let query = supabase
      .from('members')
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, user_roles(role:roles(code, name))', { count: 'exact' });

    if (params?.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
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
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, user_roles(role:roles(code, name))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapUser(data);
  },

  createUser: async (data: CreateUser): Promise<User> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is missing');
    }

    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Create user in auth
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: data.email,
      password: data.password || 'Password123',
      options: {
        data: {
          full_name: data.fullName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    const profileId = authData.user.id;
    
    // Check if profile exists (might be auto-created by trigger)
    let member = null;
    let retries = 5;
    while (retries > 0 && !member) {
      const { data: m } = await supabase
        .from('members')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      if (m) {
        member = m;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        retries--;
      }
    }

    // Upsert profile data
    const employeeId = data.employeeId || `EMP-${data.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 50);
    const { error: memberError } = await supabase
      .from('members')
      .upsert({
        id: profileId,
        email: data.email,
        full_name: data.fullName,
        employee_id: employeeId,
        is_active: true,
      });

    if (memberError) throw memberError;

    // Assign a default DEV_BE role if no roles configured
    const { data: devRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'DEV_BE')
      .maybeSingle();

    if (devRole) {
      await supabase.from('user_roles').upsert({
        member_id: profileId,
        role_id: devRole.id,
      });
    }

    // Refetch mapped user with role
    return usersApi.getUserById(profileId);
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
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, user_roles(role:roles(code, name))')
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
