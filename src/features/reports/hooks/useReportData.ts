import { useGetProjects, useGetProjectMembers } from '@/modules/projects/hooks/useProjects';
import { useGetProjectActivities } from '@/modules/projects/hooks/useProjectActivities';
import { useGetSupportTickets, useGetSupportTicket } from '@/modules/support/hooks/useSupportTickets';
import { useQueries } from '@tanstack/react-query';
import { projectActivitiesApi } from '@/modules/projects/api/project-activities.api';
import { projectsApi } from '@/modules/projects/api/projects.api';

export function useReportData(selectedProjectId: number | null, selectedTicketId: number | null) {
  // Fetch lists for dropdowns
  const { data: projectsRes, isLoading: isLoadingProjects } = useGetProjects({ perPage: 200 });
  const { data: ticketsRes, isLoading: isLoadingTickets } = useGetSupportTickets({ perPage: 200 });

  const projects = projectsRes?.data || [];
  const tickets = ticketsRes?.data || [];

  // Fetch details for selected project
  const { data: members = [], isLoading: isLoadingMembers } = useGetProjectMembers(selectedProjectId || 0);
  const { data: activities = [], isLoading: isLoadingActivities } = useGetProjectActivities(selectedProjectId || 0);

  // Fetch details for selected support ticket
  const { data: ticket, isLoading: isLoadingTicket } = useGetSupportTicket(selectedTicketId || 0);
  const assignees = ticket?.assignees || [];

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

  const allProjectActivities: Record<number, any[]> = {};
  const allProjectMembers: Record<number, any[]> = {};

  projects.forEach((p: any, idx: number) => {
    allProjectActivities[p.id] = activitiesQueries[idx]?.data || [];
    allProjectMembers[p.id] = membersQueries[idx]?.data || [];
  });

  const isAnyOverallLoading = 
    activitiesQueries.some((q) => q.isLoading) || 
    membersQueries.some((q) => q.isLoading);

  return {
    projects,
    tickets,
    members,
    activities,
    ticket,
    assignees,
    allProjectActivities,
    allProjectMembers,
    isLoadingList: isLoadingProjects || isLoadingTickets,
    isLoadingProjectDetails: isLoadingMembers || isLoadingActivities,
    isLoadingTicketDetails: isLoadingTicket,
    isLoadingOverall: isAnyOverallLoading,
  };
}
