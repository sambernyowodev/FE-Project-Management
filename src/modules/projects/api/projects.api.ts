import { supabase } from '@/shared/api/supabase';
import type { Project, ProjectMember } from '../types';
import type { components } from '@/shared/types/api';
import type { CreateProject, UpdateProject } from '../types';

const mapProject = (p: any): Project => {
  const poProject = p.po_projects && p.po_projects.length > 0 ? p.po_projects[0] : null;
  return {
    ...p,
    id: p.id,
    projectId: p.project_id,
    picClient: p.pic_client,
    customer: p.customer,
    picInternal: p.pic_internal,
    parentProjectId: p.parent_project_id,
    companyId: p.company_id,
    departmentId: p.department_id,
    businessOwnerId: p.business_owner_id,
    company: p.company ? { id: p.company.id, name: p.company.name, code: p.company.code } : null,
    department: p.department ? { id: p.department.id, name: p.department.name } : null,
    businessOwner: p.business_owner ? { id: p.business_owner.id, name: p.business_owner.name, title: p.business_owner.title } : null,
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
    poId: poProject?.po_id || undefined,
    poNumber: poProject?.purchase_orders ? (Array.isArray(poProject.purchase_orders) ? poProject.purchase_orders[0]?.po_number : poProject.purchase_orders.po_number) : undefined,
  };
};

export const projectsApi = {
  getProjects: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: Project[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let selectQuery = '*, project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*)';
    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        if (filters.poId) {
          selectQuery = '*, project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects!inner(po_id, purchase_orders(po_number))';
        } else {
          selectQuery = '*, project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))';
        }
      } catch (e) {
        selectQuery = '*, project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))';
      }
    } else {
      selectQuery = '*, project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))';
    }

    let query = supabase.from('projects').select(selectQuery, { count: 'exact' });

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
            } else if (key === 'companyId') {
              query = query.eq('company_id', val);
            } else if (key === 'departmentId') {
              query = query.eq('department_id', val);
            } else if (key === 'businessOwnerId') {
              query = query.eq('business_owner_id', val);
            } else if (key === 'projectCode') {
              query = query.ilike('project.project_code', `%${val}%`);
            } else if (key === 'name') {
              query = query.ilike('project.name', `%${val}%`);
            } else if (key === 'startDate') {
              query = query.eq('start_date', val);
            } else if (key === 'progressPct') {
              query = query.eq('progress_pct', Number(val));
            } else if (key === 'poId') {
              query = query.eq('po_projects.po_id', val);
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
      .select('*, project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapProject(data);
  },

  createProject: async (data: CreateProject & { poId?: string; companyId?: string; departmentId?: string; businessOwnerId?: string }): Promise<Project> => {
    const { data: proj, error } = await supabase
      .from('projects')
      .insert({
        project_id: data.projectId,
        pic_client: data.picClient,
        customer: data.customer,
        pic_internal: data.picInternal,
        parent_project_id: data.parentProjectId,
        company_id: data.companyId || null,
        department_id: data.departmentId || null,
        business_owner_id: data.businessOwnerId || null,
        status: data.status,
        total_mandays: data.totalMandays,
        start_date: data.startDate,
        end_date: data.endDate,
        actual_start: data.actualStart,
        actual_end: data.actualEnd,
        remarks: data.remarks,
        repository_link: data.repositoryLink,
        timeline_link: data.timelineLink,
        timeline_remark: data.timelineRemark,
        progress_pct: data.progressPct,
      })
      .select('*, project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))')
      .single();
    if (error) throw error;

    if (data.poId) {
      const { error: poErr } = await supabase
        .from('po_projects')
        .insert({
          po_id: data.poId,
          project_id: proj.id,
          allocated_mandays: proj.total_mandays || 0,
        });
      if (poErr) throw poErr;

      return projectsApi.getProjectById(proj.id);
    }

    return mapProject(proj);
  },

  updateProject: async (id: string, data: UpdateProject & { poId?: string; companyId?: string; departmentId?: string; businessOwnerId?: string }): Promise<Project> => {
    const { data: proj, error } = await supabase
      .from('projects')
      .update({
        project_id: data.projectId,
        pic_client: data.picClient,
        customer: data.customer,
        pic_internal: data.picInternal,
        parent_project_id: data.parentProjectId,
        company_id: data.companyId !== undefined ? (data.companyId || null) : undefined,
        department_id: data.departmentId !== undefined ? (data.departmentId || null) : undefined,
        business_owner_id: data.businessOwnerId !== undefined ? (data.businessOwnerId || null) : undefined,
        status: data.status,
        total_mandays: data.totalMandays,
        start_date: data.startDate,
        end_date: data.endDate,
        actual_start: data.actualStart,
        actual_end: data.actualEnd,
        remarks: data.remarks,
        repository_link: data.repositoryLink,
        timeline_link: data.timelineLink,
        timeline_remark: data.timelineRemark,
        progress_pct: data.progressPct,
      })
      .eq('id', id)
      .select('*, project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), po_projects(po_id, purchase_orders(po_number))')
      .single();
    if (error) throw error;

    // Delete existing PO project relationship
    const { error: delErr } = await supabase
      .from('po_projects')
      .delete()
      .eq('project_id', id);
    if (delErr) throw delErr;

    if (data.poId) {
      const { error: poErr } = await supabase
        .from('po_projects')
        .insert({
          po_id: data.poId,
          project_id: id,
          allocated_mandays: proj.total_mandays || 0,
        });
      if (poErr) throw poErr;

      return projectsApi.getProjectById(id);
    }

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
  },

  ensureResourcesInProject: async (
    projectId: string,
    resourceNames: string[],
    resourceRoles: Record<string, string> = {}
  ): Promise<Map<string, string>> => {
    const resourceMap = new Map<string, string>();
    const cleanedNames = Array.from(new Set(resourceNames.map(n => n.trim()).filter(Boolean)));
    if (cleanedNames.length === 0) return resourceMap;

    // 1. Get all roles from DB for name/code resolution
    const { data: allRoles } = await supabase.from('roles').select('id, code, name');
    const rolesList = allRoles || [];

    const findRoleId = (roleName?: string): string | undefined => {
      if (!roleName) {
        const fallback = rolesList.find(r => r.code === 'DEV_BE') || rolesList[0];
        return fallback?.id;
      }
      const normalized = roleName.trim().toLowerCase();
      const matched = rolesList.find(r => 
        r.code.toLowerCase() === normalized ||
        r.name.toLowerCase() === normalized ||
        r.name.toLowerCase().includes(normalized) ||
        normalized.includes(r.name.toLowerCase())
      );
      if (matched) return matched.id;
      const fallback = rolesList.find(r => r.code === 'DEV_BE') || rolesList[0];
      return fallback?.id;
    };

    // 2. Get current project members
    const existingMembers = await projectsApi.getProjectMembers(projectId);
    existingMembers.forEach(m => {
      if (m.user?.fullName) resourceMap.set(m.user.fullName.toLowerCase(), m.memberId);
      if (m.user?.email) resourceMap.set(m.user.email.toLowerCase(), m.memberId);
      if (m.user?.employeeId) resourceMap.set(m.user.employeeId.toLowerCase(), m.memberId);
      if (m.memberId) resourceMap.set(m.memberId.toLowerCase(), m.memberId);
    });

    // Determine missing names or names that need role sync
    for (const name of cleanedNames) {
      const lowerName = name.toLowerCase();
      const targetRoleName = resourceRoles[lowerName];
      const targetRoleId = findRoleId(targetRoleName);

      try {
        let userId = resourceMap.get(lowerName);

        if (!userId) {
          // Search in master members table
          const { data: globalMembers } = await supabase
            .from('members')
            .select('id, full_name, email, employee_id')
            .or(`full_name.ilike.%${name}%,employee_id.ilike.%${name}%`)
            .limit(1);

          userId = globalMembers?.[0]?.id;

          // If not found in master members table, create new member user
          if (!userId) {
            const empId = `EMP-${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 50);
            const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mii.co.id`;
            
            const { data: newMember, error: createErr } = await supabase
              .from('members')
              .insert({
                full_name: name,
                email: email,
                employee_id: empId,
                is_active: true
              })
              .select('id')
              .single();

            if (!createErr && newMember) {
              userId = newMember.id;
            }
          }
        }

        // Upsert user into project_members with correct roleId
        if (userId && targetRoleId) {
          const { data: existingPm } = await supabase
            .from('project_members')
            .select('id, role_id')
            .eq('project_id', projectId)
            .eq('member_id', userId)
            .maybeSingle();

          if (!existingPm) {
            await supabase
              .from('project_members')
              .insert({
                project_id: projectId,
                member_id: userId,
                role_id: targetRoleId,
                assigned_mandays: 0
              });
          } else if (existingPm.role_id !== targetRoleId && targetRoleName) {
            // Update role if explicitly provided in Excel
            await supabase
              .from('project_members')
              .update({ role_id: targetRoleId })
              .eq('id', existingPm.id);
          }

          resourceMap.set(lowerName, userId);
        }
      } catch (err) {
        console.error(`Failed to ensure resource "${name}" in project:`, err);
      }
    }

    return resourceMap;
  }
};
