import { supabase } from '@/shared/api/supabase';
import type { MasterProject, CreateMasterProject, UpdateMasterProject } from '../types';

const mapMasterProject = (p: any): MasterProject => ({
  id: p.id,
  projectCode: p.project_code,
  name: p.name,
  description: p.description || '',
  platform: p.platform || '',
  isActive: p.is_active,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  createdBy: p.created_by,
  updatedBy: p.updated_by,
} as any);

export const masterProjectsApi = {
  getMasterProjects: async (params?: {
    page?: number;
    perPage?: number;
    sort?: string;
    search?: string;
    filter?: string;
  }): Promise<{
    data: MasterProject[];
    meta?: { total: number; page: number; perPage: number; totalPages: number };
  }> => {
    let query = supabase
      .from('master_projects')
      .select('*', { count: 'exact' });

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,project_code.ilike.%${params.search}%`);
    }

    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (key === 'isActive') {
              query = query.eq('is_active', val === 'true' || val === true);
            } else if (key === 'projectCode') {
              query = query.ilike('project_code', `%${val}%`);
            } else if (key === 'name') {
              query = query.ilike('name', `%${val}%`);
            } else if (key === 'platform') {
              query = query.ilike('platform', `%${val}%`);
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
      const dbCol = col === 'projectCode' ? 'project_code' : col === 'isActive' ? 'is_active' : col;
      query = query.order(dbCol, { ascending: !isDesc });
    } else {
      query = query.order('project_code', { ascending: false });
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
      data: (data || []).map(mapMasterProject),
      meta: {
        total,
        page,
        perPage,
        totalPages
      }
    };
  },

  getMasterProjectById: async (id: string): Promise<MasterProject> => {
    const { data, error } = await supabase
      .from('master_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapMasterProject(data);
  },

  createMasterProject: async (data: CreateMasterProject): Promise<MasterProject> => {
    // Automatically generate project_code format HCM-YYYY-XXX
    const year = new Date().getFullYear();
    const { data: list } = await supabase
      .from('master_projects')
      .select('project_code')
      .like('project_code', `HCM-${year}-%`);
    
    let nextNum = 1;
    if (list && list.length > 0) {
      const numbers = list.map(item => {
        const parts = item.project_code.split('-');
        if (parts.length === 3) {
          return parseInt(parts[2], 10);
        }
        return 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }
    const projectCode = `HCM-${year}-${String(nextNum).padStart(3, '0')}`;

    const { data: newProj, error } = await supabase
      .from('master_projects')
      .insert({
        project_code: projectCode,
        name: data.name,
        description: data.description,
        platform: data.platform,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMasterProject(newProj);
  },

  updateMasterProject: async (id: string, data: UpdateMasterProject): Promise<MasterProject> => {
    const { data: updatedProj, error } = await supabase
      .from('master_projects')
      .update({
        name: data.name,
        description: data.description,
        platform: data.platform,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapMasterProject(updatedProj);
  },

  deleteMasterProject: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('master_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
