import { supabase } from '@/shared/api/supabase';
import type { SupportTicket, CreateSupportTicket, UpdateSupportTicket, SupportTicketAssignee, CreateSupportTicketAssignee, UpdateSupportTicketAssignee } from '../types';
import { withAuditCreated, withAuditUpdated } from '@/shared/utils/audit';

let hasPoIdSupportColumn: boolean | null = null;
async function checkPoIdSupportColumn(): Promise<boolean> {
  if (hasPoIdSupportColumn !== null) return hasPoIdSupportColumn;
  try {
    const { error } = await supabase.from('support_tickets').select('po_id').limit(1);
    hasPoIdSupportColumn = !error;
  } catch {
    hasPoIdSupportColumn = false;
  }
  return hasPoIdSupportColumn;
}

const mapTicket = (t: any): SupportTicket => {
  const po = t.purchase_orders || t.purchase_order;
  const poData = Array.isArray(po) ? po[0] : po;

  return {
    ...t,
    id: t.id,
    ticketCode: t.ticket_code,
    masterProjectId: t.master_project_id,
    picClient: t.pic_client || '',
    customer: t.customer || '',
    companyId: t.company_id,
    departmentId: t.department_id,
    businessOwnerId: t.business_owner_id,
    poId: t.po_id || poData?.id || undefined,
    poNumber: poData?.po_number || undefined,
    purchaseOrder: poData ? {
      id: poData.id,
      poNumber: poData.po_number,
      poName: poData.po_name,
    } : null,
    company: t.company ? { id: t.company.id, name: t.company.name, code: t.company.code } : null,
    department: t.department ? { id: t.department.id, name: t.department.name } : null,
    businessOwner: t.business_owner ? { id: t.business_owner.id, name: t.business_owner.name, title: t.business_owner.title } : null,
    issueTitle: t.issue_title,
    issueDescription: t.issue_description,
    hoursSpent: Number(t.hours_spent),
    mandaysSpent: Number(t.mandays_spent),
    status: t.status,
    startDate: t.start_date,
    endDate: t.end_date,
    folderAttachment: t.folder_attachment,
    notes: t.notes,
    updateDate: t.update_date || t.updated_at,
    isActive: t.is_active,
    projectName: t.master_project?.name || '',
    projectId: t.master_project_id || '',
    createdBy: t.created_by,
    updatedBy: t.updated_by,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
};

export const supportApi = {
  getTickets: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: SupportTicket[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    const canUsePo = await checkPoIdSupportColumn();
    const selectQuery = canUsePo
      ? '*, master_project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*), purchase_orders:purchase_orders(*)'
      : '*, master_project:master_projects!inner(*), company:companies(*), department:departments(*), business_owner:business_owners(*)';

    let query = supabase.from('support_tickets').select(selectQuery, { count: 'exact' });

    if (params?.search) {
      query = query.or(`issue_title.ilike.%${params.search}%,ticket_code.ilike.%${params.search}%`);
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
            } else if (key === 'poId' && canUsePo) {
              query = query.eq('po_id', val);
            } else if (key === 'ticketCode') {
              query = query.ilike('ticket_code', `%${val}%`);
            } else if (key === 'projectName') {
              query = query.ilike('master_project.name', `%${val}%`);
            } else if (key === 'startDate') {
              query = query.eq('start_date', val);
            } else if (key === 'hoursSpent') {
              query = query.eq('hours_spent', Number(val));
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
      if (column === 'ticketCode') dbColumn = 'ticket_code';
      else if (column === 'hoursSpent') dbColumn = 'hours_spent';
      else if (column === 'mandaysSpent') dbColumn = 'mandays_spent';
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
      data: (data || []).map(mapTicket),
      meta: {
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage)
      }
    };
  },

  getTicketById: async (id: string): Promise<SupportTicket> => {
    const canUsePo = await checkPoIdSupportColumn();
    const selectQuery = canUsePo
      ? '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), purchase_orders:purchase_orders(*)'
      : '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*)';

    const { data, error } = await supabase
      .from('support_tickets')
      .select(selectQuery)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapTicket(data);
  },

  createTicket: async (data: CreateSupportTicket & { companyId?: string; departmentId?: string; businessOwnerId?: string }): Promise<SupportTicket> => {
    let masterProjectId = data.masterProjectId as any;

    if (!masterProjectId && data.masterProjectName) {
      const { data: existingMaster } = await supabase
        .from('master_projects')
        .select('id')
        .eq('name', data.masterProjectName)
        .maybeSingle();

      if (existingMaster) {
        masterProjectId = existingMaster.id;
      } else {
        const year = new Date().getFullYear();
        const { count } = await supabase.from('master_projects').select('id', { count: 'exact', head: true });
        const seq = (count || 0) + 1;
        const projectCode = `HCM-${year}-${String(seq).padStart(3, '0')}`;

        const masterPayload = await withAuditCreated({
          project_code: projectCode,
          name: data.masterProjectName,
          description: `Created automatically during support ticket creation for ${data.masterProjectName}`,
          platform: 'OS',
          is_active: true,
        });

        const { data: newMaster, error: mErr } = await supabase
          .from('master_projects')
          .insert(masterPayload)
          .select('id')
          .single();
        if (mErr) throw mErr;
        masterProjectId = newMaster.id;
      }
    }

    const year = new Date().getFullYear();
    const { count } = await supabase.from('support_tickets').select('id', { count: 'exact', head: true });
    const ticketSeq = (count || 0) + 1;
    const ticketCode = `SUP-${year}-${String(ticketSeq).padStart(4, '0')}`;

    const canUsePo = await checkPoIdSupportColumn();
    const rawInsertPayload: any = {
      ticket_code: ticketCode,
      master_project_id: masterProjectId,
      customer: data.customer,
      pic_client: data.picClient,
      company_id: data.companyId || null,
      department_id: data.departmentId || null,
      business_owner_id: data.businessOwnerId || null,
      issue_title: data.issueTitle,
      issue_description: data.issueDescription,
      status: 'OPEN',
      is_active: true,
      start_date: data.startDate,
      end_date: data.endDate,
      folder_attachment: data.folderAttachment,
    };

    if (canUsePo && data.poId !== undefined) {
      rawInsertPayload.po_id = data.poId || null;
    }

    const insertPayload = await withAuditCreated(rawInsertPayload);

    const selectQuery = canUsePo
      ? '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), purchase_orders:purchase_orders(*)'
      : '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*)';

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(insertPayload)
      .select(selectQuery)
      .single();
    if (error) throw error;
    return mapTicket(ticket);
  },

  updateTicket: async (id: string, data: UpdateSupportTicket & { companyId?: string; departmentId?: string; businessOwnerId?: string }): Promise<SupportTicket> => {
    let masterProjectId = data.masterProjectId as any;

    if (!masterProjectId && data.masterProjectName) {
      const { data: existingMaster } = await supabase
        .from('master_projects')
        .select('id')
        .eq('name', data.masterProjectName)
        .maybeSingle();

      if (existingMaster) {
        masterProjectId = existingMaster.id;
      } else {
        const year = new Date().getFullYear();
        const { count } = await supabase.from('master_projects').select('id', { count: 'exact', head: true });
        const seq = (count || 0) + 1;
        const projectCode = `HCM-${year}-${String(seq).padStart(3, '0')}`;

        const masterPayload = await withAuditCreated({
          project_code: projectCode,
          name: data.masterProjectName,
          description: `Created automatically during support ticket update for ${data.masterProjectName}`,
          platform: 'OS',
          is_active: true,
        });

        const { data: newMaster, error: mErr } = await supabase
          .from('master_projects')
          .insert(masterPayload)
          .select('id')
          .single();
        if (mErr) throw mErr;
        masterProjectId = newMaster.id;
      }
    }

    const canUsePo = await checkPoIdSupportColumn();
    const rawUpdatePayload: any = {
      master_project_id: masterProjectId,
      customer: data.customer,
      pic_client: data.picClient,
      company_id: data.companyId !== undefined ? (data.companyId || null) : undefined,
      department_id: data.departmentId !== undefined ? (data.departmentId || null) : undefined,
      business_owner_id: data.businessOwnerId !== undefined ? (data.businessOwnerId || null) : undefined,
      issue_title: data.issueTitle,
      issue_description: data.issueDescription,
      hours_spent: data.hoursSpent,
      mandays_spent: data.hoursSpent ? Number((data.hoursSpent / 8).toFixed(2)) : undefined,
      status: data.status,
      notes: data.notes,
      start_date: data.startDate,
      end_date: data.endDate,
      folder_attachment: data.folderAttachment,
    };

    if (canUsePo && data.poId !== undefined) {
      rawUpdatePayload.po_id = data.poId || null;
    }

    const updatePayload = await withAuditUpdated(rawUpdatePayload);

    const selectQuery = canUsePo
      ? '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*), purchase_orders:purchase_orders(*)'
      : '*, master_project:master_projects(*), company:companies(*), department:departments(*), business_owner:business_owners(*)';

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', id)
      .select(selectQuery)
      .single();
    if (error) throw error;
    return mapTicket(ticket);
  },

  deleteTicket: async (id: string): Promise<void> => {
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) throw error;
  },

  getTicketAssignees: async (ticketId: string): Promise<SupportTicketAssignee[]> => {
    const { data, error } = await supabase
      .from('support_ticket_assignees')
      .select('*, user:members(*), role:roles(*)')
      .eq('support_ticket_id', ticketId);
    if (error) throw error;
    return (data || []).map((m: any) => ({
      ...m,
      supportTicketId: m.support_ticket_id,
      memberId: m.member_id,
      roleId: m.role_id,
      hoursSpent: Number(m.hours_spent),
      status: m.status,
      startDate: m.start_date,
      endDate: m.end_date,
      notes: m.notes,
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

  addTicketAssignee: async (ticketId: string, data: CreateSupportTicketAssignee): Promise<SupportTicketAssignee> => {
    const payload = await withAuditCreated({
      support_ticket_id: ticketId,
      member_id: data.userId as any,
      role_id: data.roleId as any,
      hours_spent: data.hoursSpent || 0,
      status: data.status || 'OPEN',
      start_date: data.startDate,
      end_date: data.endDate,
      notes: data.notes,
    });

    const { data: member, error } = await supabase
      .from('support_ticket_assignees')
      .insert(payload)
      .select('*, user:members(*), role:roles(*)')
      .single();
    if (error) throw error;

    return {
      ...member,
      supportTicketId: member.support_ticket_id,
      memberId: member.member_id,
      roleId: member.role_id,
      hoursSpent: Number(member.hours_spent),
      status: member.status,
      startDate: member.start_date,
      endDate: member.end_date,
      notes: member.notes,
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

  updateTicketAssignee: async (ticketId: string, assigneeId: string, data: UpdateSupportTicketAssignee): Promise<SupportTicketAssignee> => {
    const payload = await withAuditUpdated({
      role_id: data.roleId as any,
      hours_spent: data.hoursSpent,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate,
      notes: data.notes,
    });

    const { data: member, error } = await supabase
      .from('support_ticket_assignees')
      .update(payload)
      .eq('support_ticket_id', ticketId)
      .eq('id', assigneeId)
      .select('*, user:members(*), role:roles(*)')
      .single();
    if (error) throw error;

    return {
      ...member,
      supportTicketId: member.support_ticket_id,
      memberId: member.member_id,
      roleId: member.role_id,
      hoursSpent: Number(member.hours_spent),
      status: member.status,
      startDate: member.start_date,
      endDate: member.end_date,
      notes: member.notes,
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

  removeTicketAssignee: async (ticketId: string, assigneeId: string): Promise<void> => {
    const { error } = await supabase
      .from('support_ticket_assignees')
      .delete()
      .eq('support_ticket_id', ticketId)
      .eq('id', assigneeId);
    if (error) throw error;
  }
};
