import { supabase } from '@/shared/api/supabase';
import type { Billing, GenerateBillingRequest } from '../types';

const mapBilling = (b: any): Billing => ({
  id: b.id,
  billingNumber: b.billing_number,
  billingPeriodStart: b.billing_period_start,
  billingPeriodEnd: b.billing_period_end,
  totalMandays: Number(b.total_mandays || 0),
  totalAmount: Number(b.total_amount || 0),
  status: b.status,
  remarks: b.remarks || '',
  billingType: b.billing_type,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
} as any);

export const billingApi = {
  getBillings: async (params?: any): Promise<Billing[]> => {
    let query = supabase
      .from('billings')
      .select('*');

    if (params?.search) {
      query = query.ilike('billing_number', `%${params.search}%`);
    }

    query = query.order('billing_number', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapBilling);
  },

  getBillingById: async (id: string): Promise<Billing> => {
    const { data: bill, error: err1 } = await supabase
      .from('billings')
      .select('*')
      .eq('id', id)
      .single();

    if (err1) throw err1;

    const { data: details, error: err2 } = await supabase
      .from('billing_details')
      .select('*, roles(*), projects(id, master_projects(name))')
      .eq('billing_id', id);

    if (err2) throw err2;

    return {
      ...mapBilling(bill),
      details: (details || []).map((d: any) => ({
        id: d.id,
        billingId: d.billing_id,
        projectId: d.project_id,
        roleId: d.role_id,
        mandays: Number(d.mandays),
        ratePerManday: Number(d.rate_per_manday),
        subtotal: Number(d.subtotal),
        role: d.roles ? {
          id: d.roles.id,
          code: d.roles.code,
          name: d.roles.name,
        } : undefined,
        project: d.projects ? {
          id: d.projects.id,
          project: d.projects.master_projects ? {
            name: d.projects.master_projects.name
          } : undefined
        } : undefined,
      }))
    } as any;
  },

  getPreview: async (dto: GenerateBillingRequest): Promise<any> => {
    const isProjectType = dto.billingType === 'PROJECT';
    const isSupportType = dto.billingType === 'SUPPORT';

    const hasProjectIds = isProjectType && dto.projectIds && dto.projectIds.length > 0;
    const hasSupportTicketIds = isSupportType && dto.supportTicketIds && dto.supportTicketIds.length > 0;

    if (!hasProjectIds && !hasSupportTicketIds) {
      throw new Error(`No valid items selected for ${dto.billingType} billing type`);
    }

    // Fetch active role rates
    const { data: rates, error: ratesErr } = await supabase
      .from('role_rates')
      .select('*, roles(*)')
      .eq('is_active', true);

    if (ratesErr) throw ratesErr;

    const rateMap = new Map<string, any>();
    for (const rate of (rates || [])) {
      rateMap.set(rate.role_id, rate);
    }

    const detailItems: any[] = [];
    let projects: any[] = [];

    // 1. Process Standard Project members actual mandays
    if (hasProjectIds) {
      // Fetch projects
      const { data: projectsData, error: projErr } = await supabase
        .from('projects')
        .select('*, master_projects(name)')
        .in('id', dto.projectIds || []);

      if (projErr) throw projErr;
      projects = projectsData || [];

      // Fetch project members
      const { data: members, error: memErr } = await supabase
        .from('project_members')
        .select('*, roles(*), members(*)')
        .in('project_id', dto.projectIds || [])
        .eq('is_active', true);

      if (memErr) throw memErr;

      const projectMap = new Map<string, any>();
      for (const p of projects) {
        projectMap.set(p.id, p);
      }

      // Fetch activities for selected projects in range
      const { data: allActivities, error: actErr } = await supabase
        .from('project_activities')
        .select('*')
        .in('project_id', dto.projectIds || [])
        .gte('start_date', dto.startDate)
        .lte('start_date', dto.endDate);

      if (actErr) throw actErr;

      const groups: Record<string, {
        projectId: string;
        roleId: string;
        mandays: number;
        memberNames: string[];
      }> = {};

      for (const member of (members || [])) {
        const key = `${member.project_id}_${member.role_id}`;
        if (!groups[key]) {
          groups[key] = {
            projectId: member.project_id,
            roleId: member.role_id,
            mandays: 0,
            memberNames: [],
          };
        }

        // Calculate dynamic mandays from activities
        const memberActivities = (allActivities || []).filter(
          (act) => act.assigned_to === member.member_id && act.project_id === member.project_id
        );
        const memberMandays = memberActivities.reduce(
          (sum, act) => sum + Number(act.mandays || 0),
          0
        );

        groups[key].mandays += memberMandays;
        if (member.members?.full_name && !groups[key].memberNames.includes(member.members.full_name)) {
          groups[key].memberNames.push(member.members.full_name);
        }
      }

      for (const key of Object.keys(groups)) {
        const group = groups[key];
        if (group.mandays <= 0) continue;

        const project = projectMap.get(group.projectId);
        const isSupport = project ? project.parent_project_id !== null : false;

        const roleRate = rateMap.get(group.roleId);
        const rate = roleRate
          ? Number(isSupport ? roleRate.rate_per_manday_support : roleRate.rate_per_manday_project)
          : 0;

        const subtotal = group.mandays * rate;
        detailItems.push({
          projectId: group.projectId,
          projectName: project?.master_projects?.name || 'Unknown Project',
          roleId: group.roleId,
          roleName: roleRate?.roles?.name || 'Unknown Role',
          memberNames: group.memberNames.join(', '),
          mandays: group.mandays,
          ratePerManday: rate,
          subtotal,
        });
      }
    }

    // 2. Process Support Tickets assignees hoursSpent -> mandays
    if (hasSupportTicketIds) {
      const { data: assignees, error: assigneesErr } = await supabase
        .from('support_ticket_assignees')
        .select('*, members(*), roles(*), support_tickets(*, master_projects(name))')
        .in('support_ticket_id', dto.supportTicketIds || []);

      if (assigneesErr) throw assigneesErr;

      for (const assignee of (assignees || [])) {
        if (!assignee.role_id) continue;

        const mandays = Number(assignee.hours_spent || 0) / 8;
        const roleRate = rateMap.get(assignee.role_id);
        const rate = roleRate ? Number(roleRate.rate_per_manday_support) : 0;
        const subtotal = mandays * rate;

        detailItems.push({
          projectId: assignee.support_tickets?.master_project_id || null,
          projectName: `[SUP] ${assignee.support_tickets?.master_projects?.name || 'Unknown Project'} - ${assignee.support_tickets?.ticket_code} (${assignee.support_tickets?.issue_title})`,
          roleId: assignee.role_id,
          roleName: assignee.roles?.name || 'Unknown Role',
          memberNames: assignee.members?.full_name || 'Unknown Member',
          mandays,
          ratePerManday: rate,
          subtotal,
        });

        // Link ticket's corresponding Project to the billing header
        if (assignee.support_tickets?.master_project_id) {
          const mId = assignee.support_tickets.master_project_id;
          if (!projects.some((p) => p.id === mId)) {
            const { data: pEntity } = await supabase
              .from('projects')
              .select('*, master_projects(name)')
              .eq('id', mId)
              .maybeSingle();

            if (pEntity) {
              projects.push(pEntity);
            }
          }
        }
      }
    }

    const totalMandays = detailItems.reduce((sum, item) => sum + item.mandays, 0);
    const totalAmount = detailItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      projects,
      period: { start: dto.startDate, end: dto.endDate },
      roleBreakdown: detailItems,
      totalMandays,
      totalAmount,
      remarks: dto.remarks || '',
    };
  },

  createBilling: async (dto: GenerateBillingRequest): Promise<Billing> => {
    const preview = await billingApi.getPreview(dto);

    // Generate billing number
    const now = new Date();
    const prefix = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    
    const { data: lastBill } = await supabase
      .from('billings')
      .select('billing_number')
      .like('billing_number', `${prefix}%`)
      .order('billing_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastBill && lastBill.billing_number) {
      const sequence = parseInt(lastBill.billing_number.split('-')[2], 10);
      if (!isNaN(sequence)) nextNum = sequence + 1;
    }
    const billingNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`;

    // Get current auth user ID
    const { data: { user } } = await supabase.auth.getUser();

    // Insert billing header
    const { data: savedBilling, error: billErr } = await supabase
      .from('billings')
      .insert({
        billing_number: billingNumber,
        billing_type: dto.billingType,
        billing_period_start: dto.startDate,
        billing_period_end: dto.endDate,
        total_mandays: preview.totalMandays,
        total_amount: preview.totalAmount,
        remarks: dto.remarks || null,
        status: 'DRAFT',
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (billErr) throw billErr;

    // Link projects in junction table
    if (dto.billingType === 'PROJECT' && dto.projectIds && dto.projectIds.length > 0) {
      const bpRecords = dto.projectIds.map(pId => ({
        billing_id: savedBilling.id,
        project_id: pId
      }));
      const { error: bpErr } = await supabase.from('billing_projects').insert(bpRecords);
      if (bpErr) throw bpErr;
    }

    // Insert breakdown details
    const details = preview.roleBreakdown.map((r: any) => ({
      billing_id: savedBilling.id,
      project_id: r.projectId,
      role_id: r.roleId,
      mandays: r.mandays,
      rate_per_manday: r.ratePerManday,
      subtotal: r.subtotal,
    }));

    const { error: detErr } = await supabase.from('billing_details').insert(details);
    if (detErr) throw detErr;

    return billingApi.getBillingById(savedBilling.id);
  },

  deleteBilling: async (id: string): Promise<void> => {
    // Delete in sequence to avoid constraint issues, although cascade is set
    await supabase.from('billing_details').delete().eq('billing_id', id);
    await supabase.from('billing_projects').delete().eq('billing_id', id);
    
    const { error } = await supabase
      .from('billings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
