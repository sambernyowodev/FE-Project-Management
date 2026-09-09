import { supabase } from '@/shared/api/supabase';
import type { ProjectActivity, CreateProjectActivity, UpdateProjectActivity } from '../types';

const mapActivity = (a: any): ProjectActivity => ({
  ...a,
  id: a.id,
  projectId: a.project_id,
  parentId: a.parent_id,
  activityName: a.activity_name,
  durationDays: a.duration_days,
  startDate: a.start_date,
  endDate: a.end_date,
  actualStart: a.actual_start,
  actualEnd: a.actual_end,
  progressPct: Number(a.progress_pct),
  assignedToId: a.assigned_to,
  sortOrder: a.sort_order,
  isMilestone: a.is_milestone,
  assignedTo: a.assignedTo ? {
    id: a.assignedTo.id,
    email: a.assignedTo.email,
    fullName: a.assignedTo.full_name,
    employeeId: a.assignedTo.employee_id,
    avatarUrl: a.assignedTo.avatar_url,
    isActive: a.assignedTo.is_active,
  } : undefined,
});

export const projectActivitiesApi = {
  getActivitiesByProject: async (projectId: string): Promise<ProjectActivity[]> => {
    const { data, error } = await supabase
      .from('project_activities')
      .select('*, assignedTo:members(*)')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapActivity);
  },

  createActivity: async (data: CreateProjectActivity): Promise<ProjectActivity> => {
    const { data: act, error } = await supabase
      .from('project_activities')
      .insert({
        project_id: data.projectId,
        parent_id: data.parentId,
        activity_name: data.activityName,
        description: data.description,
        feature: data.feature,
        sub_feature: data.subFeature,
        details: data.details,
        duration_days: data.durationDays || 0,
        mandays: data.mandays || 0,
        start_date: data.startDate,
        end_date: data.endDate,
        progress_pct: data.progressPct || 0,
        phase: data.phase,
        assigned_to: data.assignedToId,
        sort_order: data.sortOrder || 0,
        is_milestone: data.isMilestone || false,
      })
      .select('*, assignedTo:members(*)')
      .single();
    if (error) throw error;

    return mapActivity(act);
  },

  updateActivity: async (id: string, data: UpdateProjectActivity): Promise<ProjectActivity> => {
    const { data: act, error } = await supabase
      .from('project_activities')
      .update({
        project_id: data.projectId,
        parent_id: data.parentId,
        activity_name: data.activityName,
        description: data.description,
        feature: data.feature,
        sub_feature: data.subFeature,
        details: data.details,
        duration_days: data.durationDays,
        mandays: data.mandays,
        start_date: data.startDate,
        end_date: data.endDate,
        progress_pct: data.progressPct,
        phase: data.phase,
        assigned_to: data.assignedToId,
        sort_order: data.sortOrder,
        is_milestone: data.isMilestone,
      })
      .eq('id', id)
      .select('*, assignedTo:members(*)')
      .single();
    if (error) throw error;

    return mapActivity(act);
  },

  deleteActivity: async (id: string): Promise<void> => {
    const { error } = await supabase.from('project_activities').delete().eq('id', id);
    if (error) throw error;
  },

  updateActivityProgress: async (id: string, progressPct: number): Promise<ProjectActivity> => {
    const { data: act, error } = await supabase
      .from('project_activities')
      .update({
        progress_pct: progressPct
      })
      .eq('id', id)
      .select('*, assignedTo:members(*)')
      .single();
    if (error) throw error;

    return mapActivity(act);
  },

  bulkCreateActivities: async (activities: CreateProjectActivity[]): Promise<ProjectActivity[]> => {
    const payload = activities.map(data => ({
      project_id: data.projectId,
      parent_id: data.parentId || null,
      activity_name: data.activityName,
      description: data.description || null,
      feature: data.feature || null,
      sub_feature: data.subFeature || null,
      details: data.details || null,
      duration_days: data.durationDays || 0,
      mandays: data.mandays || 0,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      progress_pct: data.progressPct || 0,
      phase: data.phase || 'DEVELOPMENT',
      assigned_to: data.assignedToId || null,
      sort_order: data.sortOrder || 0,
      is_milestone: data.isMilestone || false,
    }));

    const { data, error } = await supabase
      .from('project_activities')
      .insert(payload)
      .select('*, assignedTo:members(*)');

    if (error) throw error;

    return (data || []).map(mapActivity);
  },

  bulkUpdateActivities: async (updates: { id: string; data: UpdateProjectActivity }[]): Promise<void> => {
    for (const item of updates) {
      await projectActivitiesApi.updateActivity(item.id, item.data);
    }
  },

  deleteAllProjectActivities: async (projectId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_activities')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
};
