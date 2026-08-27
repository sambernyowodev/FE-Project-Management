export interface MemberProjectDetail {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  customer?: string;
  platform?: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  progressPct?: number;
  roleId?: string;
  roleName?: string;
  roleCode?: string;
  assignedMandays?: number;
  actualMandays?: number;
  isProjectActive: boolean; // status !== 'CLOSED'
}

export interface MemberSupportDetail {
  id: string;
  ticketId: string;
  ticketCode: string;
  projectName: string;
  issueTitle: string;
  customer?: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  hoursSpent?: number;
  roleId?: string;
  roleName?: string;
  roleCode?: string;
  isTicketActive: boolean; // status !== 'DONE' && status !== 'CANCELLED'
}

export interface ResourceMember {
  id: string;
  email: string;
  fullName: string;
  employeeId: string;
  avatarUrl?: string;
  isActive: boolean;
  primaryRole?: string;
  roles: { id?: string; code?: string; name?: string }[];
  activeProjects: MemberProjectDetail[];
  completedProjects: MemberProjectDetail[];
  activeSupports: MemberSupportDetail[];
  completedSupports: MemberSupportDetail[];
  isIdle: boolean; // activeProjects.length === 0 && activeSupports.length === 0
  activeProjectCount: number;
  activeSupportCount: number;
  completedProjectCount: number;
  completedSupportCount: number;
  totalActiveWorkload: number; // activeProjectCount + activeSupportCount
  totalAssignedMandays: number;
  totalSupportHours: number;
  workloadLabel: string;
}

export interface ResourceWorkloadInfo {
  memberId: string;
  fullName: string;
  email: string;
  employeeId: string;
  isActive: boolean;
  isIdle: boolean;
  activeProjectCount: number;
  activeSupportCount: number;
  totalActiveWorkload: number;
  activeProjects: { id: string; name: string; projectCode: string; status: string }[];
  activeSupports: { id: string; ticketCode: string; title: string; status: string }[];
  workloadLabel: string;
}

export interface ResourceSummaryStats {
  totalResources: number;
  totalIdle: number;
  totalInProject: number;
  totalInSupport: number;
  totalActiveWorkload: number;
  utilizationRate: number;
}

export interface ResourceFilterParams {
  search?: string;
  status?: 'all' | 'idle' | 'busy' | 'project' | 'support';
  roleId?: string;
  sortBy?: 'name' | 'workload' | 'employeeId';
  sortOrder?: 'asc' | 'desc';
}
