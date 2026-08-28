import { supabase } from '@/shared/api/supabase';
import type {
  ResourceMember,
  ResourceWorkloadInfo,
  ResourceFilterParams,
  MemberProjectDetail,
  MemberSupportDetail
} from '../types';

export const resourcesApi = {
  getResources: async (params?: ResourceFilterParams): Promise<ResourceMember[]> => {
    // 1. Fetch all members with their global member roles
    const { data: rawMembers, error: membersErr } = await supabase
      .from('members')
      .select('id, email, full_name, employee_id, avatar_url, is_active, created_at, member_roles(role:roles(id, code, name))')
      .order('full_name', { ascending: true });

    if (membersErr) throw membersErr;

    // 2. Fetch all project_members with project & role details
    const { data: rawProjectMembers, error: pmErr } = await supabase
      .from('project_members')
      .select('id, member_id, role_id, assigned_mandays, actual_mandays, is_active, role:roles(id, code, name), project:projects(id, status, customer, start_date, end_date, progress_pct, total_mandays, project_master:master_projects(id, project_code, name, platform))');

    if (pmErr) throw pmErr;

    // 3. Fetch all support_ticket_assignees with ticket & role details
    const { data: rawSupportAssignees, error: staErr } = await supabase
      .from('support_ticket_assignees')
      .select('id, member_id, role_id, hours_spent, status, start_date, end_date, role:roles(id, code, name), ticket:support_tickets(id, ticket_code, issue_title, status, customer, start_date, end_date, master_project:master_projects(id, name))');

    if (staErr) throw staErr;

    // Group projects by member_id
    const projectsByMember = new Map<string, MemberProjectDetail[]>();
    (rawProjectMembers || []).forEach((pm: any) => {
      const memberId = pm.member_id;
      if (!memberId) return;

      const proj = pm.project;
      const projMaster = proj?.project_master;
      const projStatus = proj?.status || 'PLANNING';
      const normalizedProjStatus = String(projStatus).trim().toUpperCase().replace(/[\s_]+/g, '');
      const isProjectActive =
        normalizedProjStatus !== 'CLOSED' &&
        normalizedProjStatus !== 'ONHOLD' &&
        normalizedProjStatus !== 'CANCELLED' &&
        normalizedProjStatus !== 'CANCELED';

      const detail: MemberProjectDetail = {
        id: pm.id,
        projectId: proj?.id || '',
        projectCode: projMaster?.project_code || `PRJ-${proj?.id || ''}`,
        projectName: projMaster?.name || 'Unnamed Project',
        customer: proj?.customer || '',
        platform: projMaster?.platform || '',
        status: projStatus,
        startDate: proj?.start_date,
        endDate: proj?.end_date,
        progressPct: Number(proj?.progress_pct || 0),
        roleId: pm.role_id,
        roleName: pm.role?.name || '',
        roleCode: pm.role?.code || '',
        assignedMandays: Number(pm.assigned_mandays || 0),
        actualMandays: Number(pm.actual_mandays || 0),
        isProjectActive,
      };

      const list = projectsByMember.get(memberId) || [];
      list.push(detail);
      projectsByMember.set(memberId, list);
    });

    // Group supports by member_id
    const supportsByMember = new Map<string, MemberSupportDetail[]>();
    (rawSupportAssignees || []).forEach((sta: any) => {
      const memberId = sta.member_id;
      if (!memberId) return;

      const ticket = sta.ticket;
      const ticketStatus = ticket?.status || sta.status || 'OPEN';
      const normalizedStatus = String(ticketStatus).trim().toUpperCase();
      const isTicketActive = normalizedStatus !== 'DONE' && normalizedStatus !== 'CANCELLED';

      const detail: MemberSupportDetail = {
        id: sta.id,
        ticketId: ticket?.id || '',
        ticketCode: ticket?.ticket_code || 'TICKET',
        projectName: ticket?.master_project?.name || '',
        issueTitle: ticket?.issue_title || 'Support Issue',
        customer: ticket?.customer || '',
        status: ticketStatus,
        startDate: sta.start_date || ticket?.start_date,
        endDate: sta.end_date || ticket?.end_date,
        hoursSpent: Number(sta.hours_spent || 0),
        roleId: sta.role_id,
        roleName: sta.role?.name || '',
        roleCode: sta.role?.code || '',
        isTicketActive,
      };

      const list = supportsByMember.get(memberId) || [];
      list.push(detail);
      supportsByMember.set(memberId, list);
    });

    // Map each member to ResourceMember
    let resources: ResourceMember[] = (rawMembers || []).map((m: any) => {
      const memberProjects = projectsByMember.get(m.id) || [];
      const memberSupports = supportsByMember.get(m.id) || [];

      const activeProjects = memberProjects.filter(p => p.isProjectActive);
      const completedProjects = memberProjects.filter(p => !p.isProjectActive);

      const activeSupports = memberSupports.filter(s => s.isTicketActive);
      const completedSupports = memberSupports.filter(s => !s.isTicketActive);

      const activeProjectCount = activeProjects.length;
      const activeSupportCount = activeSupports.length;
      const totalActiveWorkload = activeProjectCount + activeSupportCount;
      const isIdle = totalActiveWorkload === 0;

      const totalAssignedMandays = activeProjects.reduce((acc, p) => acc + (p.assignedMandays || 0), 0);
      const totalSupportHours = activeSupports.reduce((acc, s) => acc + (s.hoursSpent || 0), 0);

      // Compute primaryRole automatically based on the most frequent role across project & support assignments.
      // If there is a tie in frequency, select the role from the earliest project assignment.
      const roleFrequencyMap = new Map<string, { roleName: string; count: number; firstIndex: number }>();
      let assignmentOrder = 0;

      [...memberProjects, ...memberSupports].forEach((item) => {
        const rName = item.roleName;
        if (!rName) return;

        if (!roleFrequencyMap.has(rName)) {
          roleFrequencyMap.set(rName, {
            roleName: rName,
            count: 1,
            firstIndex: assignmentOrder++,
          });
        } else {
          const entry = roleFrequencyMap.get(rName)!;
          entry.count += 1;
        }
      });

      const sortedRoles = Array.from(roleFrequencyMap.values()).sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count; // Highest frequency first
        }
        return a.firstIndex - b.firstIndex; // Tie-breaker: earliest project assignment first
      });

      const roles = (m.member_roles || []).map((mr: any) => mr.role).filter(Boolean);
      const primaryRole = sortedRoles.length > 0
        ? sortedRoles[0].roleName
        : (roles.length > 0 ? roles[0].name : 'Member');

      // Generate workload label
      let workloadLabel = 'Idle';
      if (activeProjectCount > 0 && activeSupportCount > 0) {
        workloadLabel = `${activeProjectCount} Project, ${activeSupportCount} Support Aktif`;
      } else if (activeProjectCount > 0) {
        workloadLabel = `${activeProjectCount} Project Aktif`;
      } else if (activeSupportCount > 0) {
        workloadLabel = `${activeSupportCount} Support Aktif`;
      }

      return {
        id: m.id,
        email: m.email || '',
        fullName: m.full_name || 'Unnamed',
        employeeId: m.employee_id || '-',
        avatarUrl: m.avatar_url || '',
        isActive: m.is_active,
        primaryRole,
        roles,
        activeProjects,
        completedProjects,
        activeSupports,
        completedSupports,
        isIdle,
        activeProjectCount,
        activeSupportCount,
        completedProjectCount: completedProjects.length,
        completedSupportCount: completedSupports.length,
        totalActiveWorkload,
        totalAssignedMandays,
        totalSupportHours,
        workloadLabel,
      };
    });

    // Apply Client Filter & Search
    if (params?.search) {
      const q = params.search.toLowerCase();
      resources = resources.filter(r =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        r.activeProjects.some(p => p.projectName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q)) ||
        r.activeSupports.some(s => s.issueTitle.toLowerCase().includes(q) || s.ticketCode.toLowerCase().includes(q))
      );
    }

    if (params?.status) {
      if (params.status === 'idle') {
        resources = resources.filter(r => r.isIdle);
      } else if (params.status === 'busy') {
        resources = resources.filter(r => !r.isIdle);
      } else if (params.status === 'project') {
        resources = resources.filter(r => r.activeProjectCount > 0);
      } else if (params.status === 'support') {
        resources = resources.filter(r => r.activeSupportCount > 0);
      }
    }

    if (params?.roleId) {
      resources = resources.filter(r =>
        r.roles.some(role => String(role.id) === String(params.roleId)) ||
        r.activeProjects.some(p => String(p.roleId) === String(params.roleId))
      );
    }

    if (params?.sortBy === 'workload') {
      const order = params.sortOrder === 'asc' ? 1 : -1;
      resources.sort((a, b) => (a.totalActiveWorkload - b.totalActiveWorkload) * order);
    } else if (params?.sortBy === 'employeeId') {
      const order = params.sortOrder === 'desc' ? -1 : 1;
      resources.sort((a, b) => a.employeeId.localeCompare(b.employeeId) * order);
    } else {
      const order = params?.sortOrder === 'desc' ? -1 : 1;
      resources.sort((a, b) => a.fullName.localeCompare(b.fullName) * order);
    }

    return resources;
  },

  getWorkloadMap: async (): Promise<Record<string, ResourceWorkloadInfo>> => {
    const resources = await resourcesApi.getResources();
    const map: Record<string, ResourceWorkloadInfo> = {};

    resources.forEach(r => {
      map[r.id] = {
        memberId: r.id,
        fullName: r.fullName,
        email: r.email,
        employeeId: r.employeeId,
        isActive: r.isActive,
        isIdle: r.isIdle,
        activeProjectCount: r.activeProjectCount,
        activeSupportCount: r.activeSupportCount,
        totalActiveWorkload: r.totalActiveWorkload,
        activeProjects: r.activeProjects.map(p => ({
          id: p.projectId,
          name: p.projectName,
          projectCode: p.projectCode,
          status: p.status,
        })),
        activeSupports: r.activeSupports.map(s => ({
          id: s.ticketId,
          ticketCode: s.ticketCode,
          title: s.issueTitle,
          status: s.status,
        })),
        workloadLabel: r.workloadLabel,
      };
    });

    return map;
  }
};
