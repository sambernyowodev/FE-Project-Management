import { supabase } from '@/shared/api/supabase';
import type { PurchaseOrder } from '../types';

const mapPO = (p: any): PurchaseOrder => {
  const allocatedMandays = p.po_projects ? p.po_projects.reduce((sum: number, pop: any) => sum + Number(pop.allocated_mandays || 0), 0) : 0;
  const totalMandays = Number(p.total_mandays || 0);
  return {
    id: p.id,
    poNumber: p.po_number,
    poName: p.po_name,
    customer: p.customer,
    description: p.description || '',
    totalMandays: totalMandays,
    totalAmount: Number(p.total_amount || 0),
    status: p.status,
    startDate: p.start_date,
    endDate: p.end_date,
    remarks: p.remarks || '',
    isActive: p.is_active,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    allocatedMandays: allocatedMandays,
    remainingMandays: totalMandays - allocatedMandays,
    poProjects: p.po_projects ? p.po_projects.map((pop: any) => ({
      id: pop.id,
      poId: pop.po_id,
      projectId: pop.project_id,
      allocatedMandays: Number(pop.allocated_mandays),
      remarks: pop.remarks || '',
      project: pop.projects ? {
        id: pop.projects.id,
        project: pop.projects.master_projects ? {
          name: pop.projects.master_projects.name
        } : undefined
      } : undefined
    })) : [],
  } as any;
};

export const poApi = {
  getPurchaseOrders: async (params?: { page?: number; perPage?: number; sort?: string; search?: string; filter?: string }): Promise<{ data: PurchaseOrder[]; meta?: { total: number; page: number; perPage: number; totalPages: number } }> => {
    let query = supabase
      .from('purchase_orders')
      .select('*, po_projects(*, projects(*, master_projects(name)))', { count: 'exact' });

    if (params?.search) {
      query = query.or(`po_name.ilike.%${params.search}%,po_number.ilike.%${params.search}%`);
    }

    if (params?.filter) {
      try {
        const filters = JSON.parse(params.filter);
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (key === 'status') {
              query = query.eq('status', val);
            } else if (key === 'poNumber') {
              query = query.ilike('po_number', `%${val}%`);
            } else if (key === 'poName') {
              query = query.ilike('po_name', `%${val}%`);
            } else if (key === 'totalMandays') {
              query = query.eq('total_mandays', Number(val));
            } else if (key === 'totalAmount') {
              query = query.eq('total_amount', Number(val));
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
      const dbCol = col === 'poName' ? 'po_name' : col === 'poNumber' ? 'po_number' : col === 'totalMandays' ? 'total_mandays' : col === 'totalAmount' ? 'total_amount' : col;
      query = query.order(dbCol, { ascending: !isDesc });
    } else {
      query = query.order('created_at', { ascending: false });
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
      data: (data || []).map(mapPO),
      meta: {
        total,
        page,
        perPage,
        totalPages
      }
    };
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, po_projects(*, projects(*, master_projects(name)))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapPO(data);
  },

  createPurchaseOrder: async (data: { poName: string; customer: string; totalMandays: number; totalAmount: number; description?: string; startDate?: string; endDate?: string }): Promise<PurchaseOrder> => {
    let poNumber = '';
    const { data: latestPO } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .order('po_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPO && /^\d+$/.test(latestPO.po_number)) {
      poNumber = String(Number(latestPO.po_number) + 1);
    } else {
      const countRes = await supabase.from('purchase_orders').select('id', { count: 'exact', head: true });
      const count = countRes.count || 0;
      poNumber = String(4200000000 + count + 1);
    }

    const { data: newPo, error } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        po_name: data.poName,
        customer: data.customer,
        total_mandays: data.totalMandays,
        total_amount: data.totalAmount,
        description: data.description,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        status: 'DRAFT',
        is_active: true,
      })
      .select('*, po_projects(*, projects(*, master_projects(name)))')
      .single();

    if (error) throw error;
    return mapPO(newPo);
  },

  updatePurchaseOrder: async (id: string, data: Partial<{ poName: string; customer: string; totalMandays: number; totalAmount: number; description?: string; startDate?: string; endDate?: string }>): Promise<PurchaseOrder> => {
    const { data: updatedPo, error } = await supabase
      .from('purchase_orders')
      .update({
        po_name: data.poName,
        customer: data.customer,
        total_mandays: data.totalMandays,
        total_amount: data.totalAmount,
        description: data.description,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
      })
      .eq('id', id)
      .select('*, po_projects(*, projects(*, master_projects(name)))')
      .single();

    if (error) throw error;
    return mapPO(updatedPo);
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  addProjectToPO: async (poId: string, data: { projectId: string; allocatedMandays: number; remarks?: string }): Promise<void> => {
    const { error } = await supabase
      .from('po_projects')
      .insert({
        po_id: poId,
        project_id: data.projectId,
        allocated_mandays: data.allocatedMandays,
        remarks: data.remarks,
      });

    if (error) throw error;
  },

  removeProjectFromPO: async (poId: string, projectId: string): Promise<void> => {
    const { error } = await supabase
      .from('po_projects')
      .delete()
      .eq('po_id', poId)
      .eq('project_id', projectId);

    if (error) throw error;
  },

  getPurchaseOrdersByProject: async (projectId: string): Promise<PurchaseOrder[]> => {
    const { data, error } = await supabase
      .from('po_projects')
      .select('purchase_orders(*, po_projects(*, projects(*, master_projects(name))))')
      .eq('project_id', projectId);

    if (error) throw error;
    return (data || []).map((pop: any) => mapPO(pop.purchase_orders));
  },

  getProjectsWithoutPO: async (): Promise<any[]> => {
    const { data: allProjects, error: err1 } = await supabase
      .from('projects')
      .select('id, total_mandays, master_projects(name)');
    
    const { data: assignedProjects, error: err2 } = await supabase
      .from('po_projects')
      .select('project_id');

    if (err1) throw err1;
    if (err2) throw err2;

    const assignedIds = new Set((assignedProjects || []).map(ap => ap.project_id));
    
    return (allProjects || [])
      .filter(p => !assignedIds.has(p.id))
      .map(p => ({
        id: p.id,
        totalMandays: Number(p.total_mandays || 0),
        project: p.master_projects ? { name: Array.isArray(p.master_projects) ? p.master_projects[0]?.name : (p.master_projects as any).name } : undefined
      }));
  },

  getPOMembers: async (poId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('po_members')
      .select('*, project_members(*, members(*)), roles(*)')
      .eq('po_id', poId);

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      poId: m.po_id,
      projectMemberId: m.project_member_id,
      roleId: m.role_id,
      actualMandays: Number(m.actual_mandays),
      actualHours: Number(m.actual_hours),
      ratePerManday: Number(m.rate_per_manday),
      totalCost: Number(m.total_cost),
      startDate: m.start_date,
      endDate: m.end_date,
      isBillable: m.is_billable,
      role: m.roles ? {
        id: m.roles.id,
        code: m.roles.code,
        name: m.roles.name,
      } : undefined,
      projectMember: m.project_members ? {
        id: m.project_members.id,
        member: m.project_members.members ? {
          id: m.project_members.members.id,
          fullName: m.project_members.members.full_name,
          email: m.project_members.members.email,
        } : undefined
      } : undefined,
    }));
  },

  assignPOMember: async (data: { poId: string; projectMemberId: string; roleId: string; actualMandays?: number; actualHours?: number }): Promise<any> => {
    const { data: rateData } = await supabase
      .from('role_rates')
      .select('rate_per_manday_project')
      .eq('role_id', data.roleId)
      .eq('is_active', true)
      .maybeSingle();

    const ratePerManday = rateData ? Number(rateData.rate_per_manday_project) : 0;
    const actualMandays = data.actualMandays || 0;
    const actualHours = data.actualHours || (actualMandays * 8);
    const totalCost = actualMandays * ratePerManday;

    const { data: newMember, error } = await supabase
      .from('po_members')
      .insert({
        po_id: data.poId,
        project_member_id: data.projectMemberId,
        role_id: data.roleId,
        actual_mandays: actualMandays,
        actual_hours: actualHours,
        rate_per_manday: ratePerManday,
        total_cost: totalCost,
        is_billable: true,
      })
      .select()
      .single();

    if (error) throw error;
    return newMember;
  },

  updatePOMember: async (id: string, data: { actualMandays: number }): Promise<any> => {
    const { data: existing } = await supabase
      .from('po_members')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) throw new Error('PO Member not found');

    const actualMandays = data.actualMandays;
    const actualHours = actualMandays * 8;
    const totalCost = actualMandays * Number(existing.rate_per_manday);

    const { data: updated, error } = await supabase
      .from('po_members')
      .update({
        actual_mandays: actualMandays,
        actual_hours: actualHours,
        total_cost: totalCost,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  removePOMember: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('po_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
