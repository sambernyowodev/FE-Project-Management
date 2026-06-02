import { supabase } from '@/shared/api/supabase';
import type { Project, ProjectMember } from '../types';
import type { components } from '@/shared/types/api';
import type { CreateProject, UpdateProject } from '../types';

const mapProject = (p: any): Project => ({
  ...p,
  id: p.id,
  projectId: p.project_id,
  picClient: p.pic_client,
  customer: p.customer,
  picInternal: p.pic_internal,
  parentProjectId: p.parent_project_id,
  totalMandays: Number(p.total_mandays),
  startDate: p.start_date,
  endDate: p.end_date,
  actualStart: p.actual_start,
  actualEnd: p.actual_end,
  progressPct: Number(p.progress_pct),
  repositoryLink: p.repository_link,
  timelineLink: p.timeline_link,
  remarks: p.remarks,
  timelineRemark: p.timeline_remark,
  isActive: p.is_active,
  name: p.project?.name || '',
  description: p.project?.description || '',
  platform: p.project?.platform || '',
  projectCode: p.project?.project_code || `PRJ-${p.id}`,
});

export const projectsApi = {
  getProjects: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: Project[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let query = supabase.from('projects').select('*, project:master_projects!inner(*)', { count: 'exact' });

    if (params?.search) {
      query = query.ilike('project.name', `%${params.search}%`);
    }

    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (key === 'status') {
              query = query.eq('status', val);
            } else if (key === 'projectCode') {
              query = query.ilike('project.project_code', `%${val}%`);
            } else if (key === 'name') {
              query = query.ilike('project.name', `%${val}%`);
            } else if (key === 'startDate') {
              query = query.eq('start_date', val);
            } else if (key === 'progressPct') {
              query = query.eq('progress_pct', Number(val));
            }
          }
        });
      } catch (e) {
        console.error('Error parsing filter params', e);
      }
    }

    if (params?.sort) {
      const isDesc = params.sort.startsWith('-');
      const column = isDesc ? params.sort.substring(1) : params.sort;
      let dbColumn = column;
      if (column === 'projectCode') dbColumn = 'project(project_code)';
      else if (column === 'totalMandays') dbColumn = 'total_mandays';
      else if (column === 'progressPct') dbColumn = 'progress_pct';
      else if (column === 'startDate') dbColumn = 'start_date';
      else if (column === 'endDate') dbColumn = 'end_date';

      query = query.order(dbColumn, { ascending: !isDesc });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const page = params?.page || 1;
    const perPage = params?.perPage || 10;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    return {
      data: (data || []).map(mapProject),
      meta: {
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage)
      }
    };
  },

  getProjectById: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project:master_projects(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  createProject: async (data: CreateProject): Promise<Project> => {
    const { data: proj, error } = await supabase
      .from('projects')
      .insert({
        project_id: data.projectId,
        pic_client: data.picClient,
        customer: data.customer,
        pic_internal: data.picInternal,
        parent_project_id: data.parentProjectId,
        status: data.status,
        total_mandays: data.totalMandays,
        start_date: data.startDate,
        end_date: data.endDate,
        remarks: data.remarks,
        repository_link: data.repositoryLink,
        timeline_link: data.timelineLink,
        timeline_remark: data.timelineRemark,
        progress_pct: data.progressPct,
      })
      .select('*, project:master_projects(*)')
      .single();
    if (error) throw error;
    return mapProject(proj);
  },

  updateProject: async (id: string, data: UpdateProject): Promise<Project> => {
    const { data: proj, error } = await supabase
      .from('projects')
      .update({
        project_id: data.projectId,
        pic_client: data.picClient,
        customer: data.customer,
        pic_internal: data.picInternal,
        parent_project_id: data.parentProjectId,
        status: data.status,
        total_mandays: data.totalMandays,
        start_date: data.startDate,
        end_date: data.endDate,
        remarks: data.remarks,
        repository_link: data.repositoryLink,
        timeline_link: data.timelineLink,
        timeline_remark: data.timelineRemark,
        progress_pct: data.progressPct,
      })
      .eq('id', id)
      .select('*, project:master_projects(*)')
      .single();
    if (error) throw error;
    return mapProject(proj);
  },

  deleteProject: async (id: string): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, user:members(*), role:roles(*)')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data || []).map((m: any) => ({
      ...m,
      projectId: m.project_id,
      memberId: m.member_id,
      roleId: m.role_id,
      assignedMandays: Number(m.assigned_mandays),
      actualMandays: Number(m.actual_mandays),
      isActive: m.is_active,
      joinedAt: m.joined_at,
      user: m.user ? {
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.full_name,
        employeeId: m.user.employee_id,
        avatarUrl: m.user.avatar_url,
        isActive: m.user.is_active,
      } : undefined,
      role: m.role,
    })) as any;
  },

  addProjectMember: async (projectId: string, data: components['schemas']['AddProjectMemberDto']): Promise<ProjectMember> => {
    const { data: member, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        member_id: data.userId as any,
        role_id: data.roleId as any,
        assigned_mandays: data.assignedMandays || 0,
      })
      .select('*, user:members(*), role:roles(*)')
      .single();
    if (error) throw error;

    return {
      ...member,
      projectId: member.project_id,
      memberId: member.member_id,
      roleId: member.role_id,
      assignedMandays: Number(member.assigned_mandays),
      actualMandays: Number(member.actual_mandays),
      isActive: member.is_active,
      joinedAt: member.joined_at,
      user: member.user ? {
        id: member.user.id,
        email: member.user.email,
        fullName: member.user.full_name,
        employeeId: member.user.employee_id,
        avatarUrl: member.user.avatar_url,
        isActive: member.user.is_active,
      } : undefined,
      role: member.role,
    } as any;
  },

  removeProjectMember: async (projectId: string, memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('id', memberId);
    if (error) throw error;
  }
};
