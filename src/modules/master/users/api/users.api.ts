import { supabase } from '@/shared/api/supabase';
import type {
  User,
  CreateUser,
  UpdateUser,
  MemberRelationsData,
  MemberProjectRelation,
  MemberSupportRelation,
  MemberActivityRelation
} from '../types';

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
        email: data.email,
        employee_id: data.employeeId,
        is_active: data.isActive,
      })
      .eq('id', id)
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, updated_at, member_roles(role:roles(code, name))')
      .single();

    if (error) throw error;
    return mapUser(updatedMember);
  },

  toggleUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    const { error } = await supabase
      .from('members')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },

  getMemberRelations: async (memberId: string): Promise<MemberRelationsData> => {
    // 1. Fetch project_members for this member
    const { data: rawPm, error: pmErr } = await supabase
      .from('project_members')
      .select('id, project_id, role:roles(name), assigned_mandays, project:projects(id, status, project_master:master_projects(project_code, name))')
      .eq('member_id', memberId);

    if (pmErr) throw pmErr;

    // 2. Fetch support_ticket_assignees for this member
    const { data: rawSta, error: staErr } = await supabase
      .from('support_ticket_assignees')
      .select('id, support_ticket_id, role:roles(name), ticket:support_tickets(id, ticket_code, issue_title, status)')
      .eq('member_id', memberId);

    if (staErr) throw staErr;

    // 3. Fetch activities assigned to this member
    const { data: rawActivities, count, error: actErr } = await supabase
      .from('project_activities')
      .select('id, project_id, activity_name, feature, phase, progress_pct, project:projects(id, project_master:master_projects(project_code, name))', { count: 'exact' })
      .eq('assigned_to', memberId);

    if (actErr) throw actErr;

    const projects: MemberProjectRelation[] = (rawPm || []).map((pm: any) => ({
      id: pm.id,
      projectId: pm.project_id,
      projectCode: pm.project?.project_master?.project_code || `PRJ-${pm.project_id}`,
      projectName: pm.project?.project_master?.name || 'Unnamed Project',
      status: pm.project?.status || 'UNKNOWN',
      roleName: pm.role?.name || 'Team Member',
      assignedMandays: Number(pm.assigned_mandays || 0),
    }));

    const supports: MemberSupportRelation[] = (rawSta || []).map((sta: any) => ({
      id: sta.id,
      ticketId: sta.support_ticket_id,
      ticketCode: sta.ticket?.ticket_code || `TKT-${sta.support_ticket_id}`,
      issueTitle: sta.ticket?.issue_title || 'Unnamed Ticket',
      status: sta.ticket?.status || 'UNKNOWN',
      roleName: sta.role?.name || 'Assignee',
    }));

    const activities: MemberActivityRelation[] = (rawActivities || []).map((act: any) => ({
      id: act.id,
      projectId: act.project_id,
      projectCode: act.project?.project_master?.project_code || `PRJ-${act.project_id}`,
      projectName: act.project?.project_master?.name || 'Unnamed Project',
      activityName: act.activity_name || 'Unnamed Task',
      feature: act.feature,
      phase: act.phase,
      progressPct: Number(act.progress_pct || 0),
    }));

    return {
      memberId,
      projects,
      supports,
      activities,
      activityCount: count ?? activities.length,
    };
  },

  unassignMemberActivity: async (activityId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_activities')
      .update({ assigned_to: null })
      .eq('id', activityId);

    if (error) throw error;
  },

  unassignAllMemberActivities: async (memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_activities')
      .update({ assigned_to: null })
      .eq('assigned_to', memberId);

    if (error) throw error;
  },

  removeMemberFromProject: async (memberId: string, projectId: string): Promise<void> => {
    // Release project activities assigned to this member in this project
    await supabase
      .from('project_activities')
      .update({ assigned_to: null })
      .eq('assigned_to', memberId)
      .eq('project_id', projectId);

    // Delete project_members record
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('member_id', memberId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  removeMemberFromSupport: async (memberId: string, ticketId: string): Promise<void> => {
    const { error } = await supabase
      .from('support_ticket_assignees')
      .delete()
      .eq('member_id', memberId)
      .eq('support_ticket_id', ticketId);

    if (error) throw error;
  },

  reassignProjectMember: async (fromMemberId: string, toMemberId: string, projectId: string): Promise<void> => {
    const { data: existingTarget } = await supabase
      .from('project_members')
      .select('id, assigned_mandays')
      .eq('member_id', toMemberId)
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: sourcePm } = await supabase
      .from('project_members')
      .select('id, assigned_mandays')
      .eq('member_id', fromMemberId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (existingTarget && sourcePm) {
      const totalMandays = Number(existingTarget.assigned_mandays || 0) + Number(sourcePm.assigned_mandays || 0);
      await supabase
        .from('project_members')
        .update({ assigned_mandays: totalMandays })
        .eq('id', existingTarget.id);

      await supabase
        .from('project_members')
        .delete()
        .eq('id', sourcePm.id);
    } else if (sourcePm) {
      await supabase
        .from('project_members')
        .update({ member_id: toMemberId })
        .eq('id', sourcePm.id);
    }

    await supabase
      .from('project_activities')
      .update({ assigned_to: toMemberId })
      .eq('assigned_to', fromMemberId)
      .eq('project_id', projectId);
  },

  reassignSupportTicketMember: async (fromMemberId: string, toMemberId: string, ticketId: string): Promise<void> => {
    const { data: existingTarget } = await supabase
      .from('support_ticket_assignees')
      .select('id')
      .eq('member_id', toMemberId)
      .eq('support_ticket_id', ticketId)
      .maybeSingle();

    if (existingTarget) {
      await supabase
        .from('support_ticket_assignees')
        .delete()
        .eq('member_id', fromMemberId)
        .eq('support_ticket_id', ticketId);
    } else {
      await supabase
        .from('support_ticket_assignees')
        .update({ member_id: toMemberId })
        .eq('member_id', fromMemberId)
        .eq('support_ticket_id', ticketId);
    }
  },

  reassignActivityMember: async (toMemberId: string, activityId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_activities')
      .update({ assigned_to: toMemberId })
      .eq('id', activityId);

    if (error) throw error;
  },

  reassignAllMemberRelations: async (fromMemberId: string, toMemberId: string): Promise<void> => {
    const { data: pmList } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('member_id', fromMemberId);

    for (const pm of pmList || []) {
      await usersApi.reassignProjectMember(fromMemberId, toMemberId, pm.project_id);
    }

    const { data: staList } = await supabase
      .from('support_ticket_assignees')
      .select('support_ticket_id')
      .eq('member_id', fromMemberId);

    for (const sta of staList || []) {
      await usersApi.reassignSupportTicketMember(fromMemberId, toMemberId, sta.support_ticket_id);
    }

    await supabase
      .from('project_activities')
      .update({ assigned_to: toMemberId })
      .eq('assigned_to', fromMemberId);
  },

  deleteUser: async (id: string): Promise<void> => {
    // 1. Release activity assignments first
    await supabase.from('project_activities').update({ assigned_to: null }).eq('assigned_to', id);

    // 2. Delete relations
    await supabase.from('member_roles').delete().eq('member_id', id);
    await supabase.from('project_members').delete().eq('member_id', id);
    await supabase.from('support_ticket_assignees').delete().eq('member_id', id);

    // 3. Delete member record
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
