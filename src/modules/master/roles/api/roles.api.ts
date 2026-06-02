import { supabase } from '@/shared/api/supabase';
import type { Role } from '../types';

const mapRole = (r: any): Role => ({
  id: r.id,
  code: r.code,
  name: r.name,
  description: r.description || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  createdBy: r.created_by,
  updatedBy: r.updated_by,
} as any);

export const rolesApi = {
  getRoles: async (): Promise<Role[]> => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapRole);
  },

  getRoleById: async (id: string): Promise<Role> => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapRole(data);
  },

  createRole: async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Role> => {
    const { data: newRole, error } = await supabase
      .from('roles')
      .insert({
        code: data.code,
        name: data.name,
        description: data.description,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRole(newRole);
  },

  updateRole: async (id: string, data: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>): Promise<Role> => {
    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update({
        code: data.code,
        name: data.name,
        description: data.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRole(updatedRole);
  },

  deleteRole: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
