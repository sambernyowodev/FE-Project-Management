import { useGetProjects, useGetProjectMembers } from '@/modules/projects/hooks/useProjects';
import { useGetProjectActivities } from '@/modules/projects/hooks/useProjectActivities';
import { useGetSupportTickets, useGetSupportTicket, useGetTicketAssignees } from '@/modules/support/hooks/useSupportTickets';
import { useQueries } from '@tanstack/react-query';
import { projectActivitiesApi } from '@/modules/projects/api/project-activities.api';
import { projectsApi } from '@/modules/projects/api/projects.api';
import { supportApi } from '@/modules/support/api/support.api';

export function useReportData(selectedProjectId: string | null, selectedTicketId: string | null) {
  // Fetch lists for dropdowns
  const { data: projectsRes, isLoading: isLoadingProjects } = useGetProjects({ perPage: 200 });
  const { data: ticketsRes, isLoading: isLoadingTickets } = useGetSupportTickets({ perPage: 200 });

  const projects = projectsRes?.data || [];
  const tickets = ticketsRes?.data || [];

  // Fetch details for selected project
  const { data: members = [], isLoading: isLoadingMembers } = useGetProjectMembers(selectedProjectId || '');
  const { data: activities = [], isLoading: isLoadingActivities } = useGetProjectActivities(selectedProjectId || '');

  // Fetch details for selected support ticket
  const { data: ticket, isLoading: isLoadingTicket } = useGetSupportTicket(selectedTicketId || '');
  const { data: ticketAssignees = [], isLoading: isLoadingTicketAssignees } = useGetTicketAssignees(selectedTicketId || '');
  const assignees = ticketAssignees;

  // Parallel fetching of activities and members for ALL projects (for overall report)
  const activitiesQueries = useQueries({
    queries: projects.map((p: any) => ({
      queryKey: ['project-activities', p.id],
      queryFn: () => projectActivitiesApi.getActivitiesByProject(p.id),
      enabled: projects.length > 0,
    }))
  });

  const membersQueries = useQueries({
    queries: projects.map((p: any) => ({
      queryKey: ['project-members', p.id],
      queryFn: () => projectsApi.getProjectMembers(p.id),
      enabled: projects.length > 0,
    }))
  });

  // Parallel fetching of support ticket assignees for ALL tickets (for overall report)
  const ticketAssigneesQueries = useQueries({
    queries: tickets.map((t: any) => ({
      queryKey: ['support-ticket-assignees', t.id],
      queryFn: () => supportApi.getTicketAssignees(t.id),
      enabled: tickets.length > 0,
    }))
  });

  const allProjectActivities: Record<string, any[]> = {};
  const allProjectMembers: Record<string, any[]> = {};
  const allTicketAssignees: Record<string, any[]> = {};

  projects.forEach((p: any, idx: number) => {
    allProjectActivities[p.id] = activitiesQueries[idx]?.data || [];
    allProjectMembers[p.id] = membersQueries[idx]?.data || [];
  });

  tickets.forEach((t: any, idx: number) => {
    allTicketAssignees[t.id] = ticketAssigneesQueries[idx]?.data || [];
  });

  const isAnyOverallLoading = 
    activitiesQueries.some((q) => q.isLoading) || 
    membersQueries.some((q) => q.isLoading) ||
    ticketAssigneesQueries.some((q) => q.isLoading);

  return {
    projects,
    tickets,
    members,
    activities,
    ticket,
    assignees,
    allProjectActivities,
    allProjectMembers,
    allTicketAssignees,
    isLoadingList: isLoadingProjects || isLoadingTickets,
    isLoadingProjectDetails: isLoadingMembers || isLoadingActivities,
    isLoadingTicketDetails: isLoadingTicket || isLoadingTicketAssignees,
    isLoadingOverall: isAnyOverallLoading,
  };
}


