import { useState, useEffect, useRef } from 'react';
import { useReportData } from './hooks/useReportData';
import {
  FileSpreadsheet,
  Users,
  Clock,
  Briefcase,
  Layers,
  Award,
  Calendar,
  Search,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Custom Searchable Dropdown
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label
}: {
  options: { id: number; label: string }[];
  value: number | null;
  onChange: (id: number) => void;
  placeholder: string;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      <label className="text-xs font-bold text-on-background uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm bg-background text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer transition-all hover:bg-surface-container-low"
      >
        <span className={selectedOption ? 'text-on-background font-bold' : 'text-secondary font-medium'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-xs text-secondary transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg flex flex-col p-1.5 max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5 px-2.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-lg mb-1.5">
            <Search className="w-3.5 h-3.5 text-secondary" />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 text-on-background placeholder:text-secondary"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 flex flex-col gap-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2.5 text-left text-xs rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                    o.id === value
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-surface-container-low text-on-background'
                  }`}
                >
                  <span>{o.label}</span>
                  {o.id === value && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-secondary text-center">
                Tidak ada hasil
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'project' | 'support'>('project');
  const [projectSubTab, setProjectSubTab] = useState<'overview' | 'detail'>('overview');
  const [supportSubTab, setSupportSubTab] = useState<'overview' | 'detail'>('overview');

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Project Overview Filters
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');

  // Support Overview Filters
  const [supportStartDate, setSupportStartDate] = useState('');
  const [supportEndDate, setSupportEndDate] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');

  const {
    projects,
    tickets,
    members,
    activities,
    ticket,
    assignees,
    allProjectActivities,
    allProjectMembers,
    isLoadingList,
    isLoadingProjectDetails,
    isLoadingTicketDetails,
    isLoadingOverall
  } = useReportData(selectedProjectId, selectedTicketId);

  // Set default selection when lists load
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (tickets.length > 0 && selectedTicketId === null) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  // Project Helpers
  const getProjectMemberDetails = () => {
    return members.map((m: any) => {
      const actualMandays = activities
        .filter((act: any) => act.assignedToId === m.userId)
        .reduce((sum: number, act: any) => sum + (act.mandays || 0), 0);
      const activityCount = activities.filter((act: any) => act.assignedToId === m.userId).length;
      return {
        id: m.id,
        userId: m.userId,
        userName: m.user?.fullName || `User ID: ${m.userId}`,
        userEmail: m.user?.email || '',
        roleName: m.role?.name || 'Resource',
        activityCount,
        actualMandays,
      };
    });
  };

  const getProjectRoleSummaries = () => {
    const rolesMap = new Map<number, { roleName: string; count: number; userIds: Set<number> }>();
    members.forEach((m: any) => {
      const roleId = m.roleId;
      const roleName = m.role?.name || 'Resource';

      if (!rolesMap.has(roleId)) {
        rolesMap.set(roleId, { roleName, count: 0, userIds: new Set<number>() });
      }
      const item = rolesMap.get(roleId);
      if (item) {
        item.count += 1;
        item.userIds.add(m.userId);
      }
    });

    return Array.from(rolesMap.values()).map(r => {
      const actual = Array.from(r.userIds).reduce((sum: number, userId: number) => {
        return sum + activities
          .filter((act: any) => act.assignedToId === userId)
          .reduce((s: number, act: any) => s + (act.mandays || 0), 0);
      }, 0);
      return {
        roleName: r.roleName,
        count: r.count,
        aktual: actual,
      };
    });
  };

  // Support Helpers
  const getSupportRoleSummaries = () => {
    const rolesMap = new Map<number, { roleName: string; count: number; hours: number }>();
    assignees.forEach((a: any) => {
      const roleId = a.roleId || 0;
      const roleName = a.role?.name || 'Resource';
      const hours = a.hoursSpent || 0;

      if (!rolesMap.has(roleId)) {
        rolesMap.set(roleId, { roleName, count: 0, hours: 0 });
      }
      const item = rolesMap.get(roleId);
      if (item) {
        item.count += 1;
        item.hours += hours;
      }
    });
    return Array.from(rolesMap.values()).map(r => ({
      roleName: r.roleName,
      count: r.count,
      hours: r.hours,
      mandays: r.hours / 8
    }));
  };

  // Overall Report Calculations
  const getOverallProjectData = () => {
    return projects.map((p: any) => {
      const projActivities = allProjectActivities[p.id] || [];
      const projMembers = allProjectMembers[p.id] || [];

      // Filter activities by date range if specified
      const filteredActivities = projActivities.filter((act: any) => {
        if (!projectStartDate && !projectEndDate) return true;
        const actDate = act.startDate ? new Date(act.startDate) : (p.startDate ? new Date(p.startDate) : null);
        if (!actDate) return true;
        const start = projectStartDate ? new Date(projectStartDate) : null;
        const end = projectEndDate ? new Date(projectEndDate) : null;
        
        if (start && actDate < start) return false;
        if (end && actDate > end) return false;
        return true;
      });

      const totalMandays = filteredActivities.reduce((sum: number, act: any) => sum + (act.mandays || 0), 0);

      return {
        id: p.id,
        name: p.name,
        projectCode: p.projectCode,
        customer: p.customer || '-',
        platform: p.platform || '-',
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        memberCount: projMembers.length,
        totalMandays,
      };
    }).filter((p: any) => {
      // Filter by Status
      if (projectStatusFilter !== 'ALL' && p.status !== projectStatusFilter) return false;
      // Filter by Date Range
      if (projectStartDate || projectEndDate) {
        const start = projectStartDate ? new Date(projectStartDate) : null;
        const end = projectEndDate ? new Date(projectEndDate) : null;
        const pStart = p.startDate ? new Date(p.startDate) : null;
        const pEnd = p.endDate ? new Date(p.endDate) : null;

        if (start && pEnd && pEnd < start) return false;
        if (end && pStart && pStart > end) return false;
      }
      return true;
    });
  };

  const getOverallSupportData = () => {
    return tickets.map((t: any) => {
      const ticketAssignees = t.assignees || [];

      const filteredAssignees = ticketAssignees.filter((a: any) => {
        if (!supportStartDate && !supportEndDate) return true;
        const aDate = a.startDate ? new Date(a.startDate) : (t.startDate ? new Date(t.startDate) : (t.createdAt ? new Date(t.createdAt) : null));
        if (!aDate) return true;
        const start = supportStartDate ? new Date(supportStartDate) : null;
        const end = supportEndDate ? new Date(supportEndDate) : null;

        if (start && aDate < start) return false;
        if (end && aDate > end) return false;
        return true;
      });

      const hoursSpent = filteredAssignees.reduce((sum: number, a: any) => sum + (a.hoursSpent || 0), 0);

      return {
        id: t.id,
        ticketCode: t.ticketCode,
        projectName: t.masterProject?.name || 'Project Tanpa Nama',
        customer: t.customer || '-',
        issueTitle: t.issueTitle,
        status: t.status,
        startDate: t.startDate || t.createdAt,
        endDate: t.endDate,
        assigneeCount: ticketAssignees.length,
        hoursSpent,
        totalMandays: hoursSpent / 8,
      };
    }).filter((t: any) => {
      // Filter by Status
      if (supportStatusFilter !== 'ALL' && t.status !== supportStatusFilter) return false;
      // Filter by Date Range
      if (supportStartDate || supportEndDate) {
        const start = supportStartDate ? new Date(supportStartDate) : null;
        const end = supportEndDate ? new Date(supportEndDate) : null;
        const tStart = t.startDate ? new Date(t.startDate) : null;
        const tEnd = t.endDate ? new Date(t.endDate) : null;

        if (start && tEnd && tEnd < start) return false;
        if (end && tStart && tStart > end) return false;
      }
      return true;
    });
  };

  // EXCEL EXPORTERS
  const handleExportProjectDetail = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return;

    const memberDetails = getProjectMemberDetails();
    const roleSummaries = getProjectRoleSummaries();

    const metaData = [
      { key: 'Nama Project', value: selectedProject.name },
      { key: 'Project Code', value: selectedProject.projectCode },
      { key: 'Customer', value: selectedProject.customer || '-' },
      { key: 'Platform', value: selectedProject.platform || '-' },
      { key: 'Status', value: selectedProject.status || '-' },
      { key: 'Report Date', value: new Date().toLocaleDateString() }
    ];

    const memberRows = memberDetails.map(m => ({
      'Nama Member': m.userName,
      'Email': m.userEmail,
      'Role': m.roleName,
      'Jumlah Task': m.activityCount,
      'Mandays (dari Tasks)': m.actualMandays
    }));

    const roleRows = roleSummaries.map(r => ({
      'Role': r.roleName,
      'Jumlah Member': r.count,
      'Total Mandays': r.aktual
    }));

    const wb = XLSX.utils.book_new();
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    const wsMembers = XLSX.utils.json_to_sheet(memberRows);
    const wsRoles = XLSX.utils.json_to_sheet(roleRows);

    XLSX.utils.book_append_sheet(wb, wsMeta, 'Info Project');
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Detail Mandays Member');
    XLSX.utils.book_append_sheet(wb, wsRoles, 'Ringkasan Per Role');

    const fileName = `Report_Project_Mandays_${selectedProject.name.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportSupportDetail = () => {
    if (!ticket) return;

    const roleSummaries = getSupportRoleSummaries();

    const metaData = [
      { key: 'Ticket Code', value: ticket.ticketCode },
      { key: 'Project', value: ticket.masterProject?.name || '-' },
      { key: 'Customer', value: ticket.customer || '-' },
      { key: 'PIC Client', value: ticket.picClient || '-' },
      { key: 'Judul Issue', value: ticket.issueTitle },
      { key: 'Total Hours Tiket', value: ticket.hoursSpent },
      { key: 'Total Mandays Tiket', value: ticket.hoursSpent / 8 },
      { key: 'Status', value: ticket.status || 'OPEN' },
      { key: 'Report Date', value: new Date().toLocaleDateString() }
    ];

    const assigneeRows = assignees.map(a => ({
      'Nama Member': a.user?.fullName || `User ID: ${a.userId}`,
      'Email': a.user?.email || '',
      'Role': a.role?.name || 'Resource',
      'Hours Spent': a.hoursSpent || 0,
      'Mandays Spent (Hours/8)': (a.hoursSpent || 0) / 8,
      'Status Kerja': a.status || 'OPEN',
      'Jadwal': a.startDate ? `${a.startDate.substring(0, 10)} s/d ${a.endDate ? a.endDate.substring(0, 10) : '-'}` : '-',
      'Catatan': a.notes || ''
    }));

    const roleRows = roleSummaries.map(r => ({
      'Role': r.roleName,
      'Jumlah Member': r.count,
      'Total Hours': r.hours,
      'Total Mandays (Hours/8)': r.mandays
    }));

    const wb = XLSX.utils.book_new();
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    const wsAssignees = XLSX.utils.json_to_sheet(assigneeRows);
    const wsRoles = XLSX.utils.json_to_sheet(roleRows);

    XLSX.utils.book_append_sheet(wb, wsMeta, 'Info Tiket');
    XLSX.utils.book_append_sheet(wb, wsAssignees, 'Detail Waktu Assignee');
    XLSX.utils.book_append_sheet(wb, wsRoles, 'Ringkasan Per Role');

    const fileName = `Report_Support_Mandays_${ticket.ticketCode}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportOverallProjects = (filteredProjects: any[]) => {
    const metaData = [
      { key: 'Rentang Tanggal', value: (projectStartDate || projectEndDate) ? `${projectStartDate || '-'} s/d ${projectEndDate || '-'}` : 'Semua Tanggal' },
      { key: 'Filter Status Project', value: projectStatusFilter },
      { key: 'Total Mandays', value: filteredProjects.reduce((sum, p) => sum + p.totalMandays, 0) },
      { key: 'Report Date', value: new Date().toLocaleDateString() }
    ];

    const projectRows = filteredProjects.map(p => ({
      'Project Code': p.projectCode,
      'Nama Project': p.name,
      'Platform': p.platform,
      'Customer': p.customer,
      'Status': p.status,
      'Tanggal Mulai': p.startDate ? p.startDate.substring(0, 10) : '-',
      'Tanggal Selesai': p.endDate ? p.endDate.substring(0, 10) : '-',
      'Jumlah Member': p.memberCount,
      'Total Mandays': p.totalMandays
    }));

    const wb = XLSX.utils.book_new();
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    const wsProjects = XLSX.utils.json_to_sheet(projectRows);

    XLSX.utils.book_append_sheet(wb, wsMeta, 'Filter & Ringkasan');
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Rekap Project');

    const fileName = `Report_Overall_Projects_Mandays_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportOverallSupport = (filteredSupport: any[]) => {
    const metaData = [
      { key: 'Rentang Tanggal', value: (supportStartDate || supportEndDate) ? `${supportStartDate || '-'} s/d ${supportEndDate || '-'}` : 'Semua Tanggal' },
      { key: 'Filter Status Support', value: supportStatusFilter },
      { key: 'Total Jam Kerja', value: filteredSupport.reduce((sum, t) => sum + t.hoursSpent, 0) },
      { key: 'Total Mandays (Hours/8)', value: filteredSupport.reduce((sum, t) => sum + t.totalMandays, 0) },
      { key: 'Report Date', value: new Date().toLocaleDateString() }
    ];

    const supportRows = filteredSupport.map(t => ({
      'Ticket Code': t.ticketCode,
      'Nama Project': t.projectName,
      'Judul Issue': t.issueTitle,
      'Customer': t.customer,
      'Status': t.status,
      'Tanggal Pengerjaan': t.startDate ? t.startDate.substring(0, 10) : '-',
      'Jumlah Assignee': t.assigneeCount,
      'Total Jam Kerja': t.hoursSpent,
      'Total Mandays (Hours/8)': t.totalMandays
    }));

    const wb = XLSX.utils.book_new();
    const wsMeta = XLSX.utils.json_to_sheet(metaData);
    const wsSupport = XLSX.utils.json_to_sheet(supportRows);

    XLSX.utils.book_append_sheet(wb, wsMeta, 'Filter & Ringkasan');
    XLSX.utils.book_append_sheet(wb, wsSupport, 'Rekap Support');

    const fileName = `Report_Overall_Support_Mandays_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const projectMemberDetails = getProjectMemberDetails();
  const projectRoleSummaries = getProjectRoleSummaries();
  const supportRoleSummaries = getSupportRoleSummaries();

  // Project Metrics
  const projectTotalAktual = Array.from(new Set(members.map((m: any) => m.userId)))
    .reduce((sum, userId) => {
      return sum + activities
        .filter((act: any) => act.assignedToId === userId)
        .reduce((s: number, act: any) => s + (act.mandays || 0), 0);
    }, 0);

  // Support Metrics
  const supportTotalHours = assignees.reduce((sum: number, a: any) => sum + (a.hoursSpent || 0), 0);
  const supportTotalMandays = supportTotalHours / 8;

  // Overall lists based on filters
  const overallProjectsFiltered = getOverallProjectData();
  const overallSupportFiltered = getOverallSupportData();

  const overallTotalProjectMandays = overallProjectsFiltered.reduce((sum, p) => sum + p.totalMandays, 0);

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Project & Support Reports</h1>
        <p className="text-secondary text-sm">Rekapitulasi dan analisis mandays tim secara detail maupun keseluruhan.</p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('project')}
          className={`px-6 py-3 text-sm font-bold border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'project'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-background'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Laporan Project</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-6 py-3 text-sm font-bold border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-on-background'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Laporan Support Ticket</span>
        </button>
      </div>

      {isLoadingList ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-secondary text-sm">Memuat data...</span>
        </div>
      ) : (
        <>
          {activeTab === 'project' && (
            /* PROJECT REPORTS SECTION */
            <div className="flex flex-col gap-6">
              {/* Segmented Control Sub-Tabs (OVERVIEW first!) */}
              <div className="flex gap-2 p-1 bg-surface-container-low border border-outline-variant/60 rounded-xl w-fit shadow-inner">
                <button
                  onClick={() => setProjectSubTab('overview')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    projectSubTab === 'overview'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                  }`}
                >
                  Overview Semua Project
                </button>
                <button
                  onClick={() => setProjectSubTab('detail')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    projectSubTab === 'detail'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                  }`}
                >
                  Fokus Detail Project
                </button>
              </div>

              {projectSubTab === 'overview' ? (
                /* Subtab: Project Overview (Laporan Keseluruhan) */
                <div className="flex flex-col gap-6">
                  {/* Filters Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-outline-variant/60 pb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Filter Rentang Waktu & Status (Project)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Tanggal Mulai</label>
                        <input
                          type="date"
                          value={projectStartDate}
                          onChange={(e) => setProjectStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Tanggal Selesai</label>
                        <input
                          type="date"
                          value={projectEndDate}
                          onChange={(e) => setProjectEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Status Project</label>
                        <select
                          value={projectStatusFilter}
                          onChange={(e) => setProjectStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                          <option value="ALL">Semua Status Project</option>
                          <option value="PLANNING">PLANNING</option>
                          <option value="IN PROGRESS">IN PROGRESS</option>
                          <option value="SIT">SIT</option>
                          <option value="UAT">UAT</option>
                          <option value="FUT">FUT</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="ON HOLD">ON HOLD</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-outline-variant/60 pt-4 mt-2">
                      <button
                        onClick={() => {
                          setProjectStartDate('');
                          setProjectEndDate('');
                          setProjectStatusFilter('ALL');
                        }}
                        className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-xs font-bold cursor-pointer"
                      >
                        Reset Filter
                      </button>

                      <button
                        onClick={() => handleExportOverallProjects(overallProjectsFiltered)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Rekap Project</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingOverall ? (
                    <div className="flex items-center justify-center min-h-[250px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-secondary text-sm">Menghitung mandays project...</span>
                    </div>
                  ) : (
                    <>
                      {/* Metric Card */}
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4 max-w-sm">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Mandays Semua Project</span>
                          <span className="text-xl font-bold text-primary">{overallTotalProjectMandays.toFixed(1)} md</span>
                          <span className="text-[10px] text-secondary block mt-0.5">Dari {overallProjectsFiltered.length} project</span>
                        </div>
                      </div>

                      {/* Overview Table */}
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3">
                        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
                          <h3 className="font-bold text-on-background text-sm">Rekap Mandays Semua Project</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                <th className="px-6 py-3.5">Code</th>
                                <th className="px-6 py-3.5">Nama Project</th>
                                <th className="px-6 py-3.5">Platform</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-center">Jumlah Member</th>
                                <th className="px-6 py-3.5 text-right">Total Mandays</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/60 font-medium">
                              {overallProjectsFiltered.length > 0 ? (
                                overallProjectsFiltered.map((p) => (
                                  <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-secondary">{p.projectCode}</td>
                                    <td className="px-6 py-4 font-bold text-on-background">{p.name}</td>
                                    <td className="px-6 py-4 text-secondary">{p.platform}</td>
                                    <td className="px-6 py-4 text-secondary">{p.customer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                        {p.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary">{p.memberCount} orang</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{p.totalMandays.toFixed(1)} md</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="px-6 py-8 text-center text-secondary">
                                    Tidak ada data project yang sesuai dengan filter.
                                  </td>
                                </tr>
                              )}
                              {overallProjectsFiltered.length > 0 && (
                                <tr className="font-bold bg-surface-container-high/20 border-t border-outline-variant text-on-background">
                                  <td className="px-6 py-4" colSpan={5}>Total Project Mandays</td>
                                  <td className="px-6 py-4 text-center font-mono text-secondary">
                                    {overallProjectsFiltered.reduce((sum, p) => sum + p.memberCount, 0)} orang
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-primary">
                                    {overallTotalProjectMandays.toFixed(1)} md
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Subtab: Project Detail */
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* Selector Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                    <div className="w-full sm:max-w-md">
                      <SearchableSelect
                        label="Pilih Project"
                        placeholder="-- Pilih Project --"
                        options={projects.map((p: any) => ({ id: p.id, label: `${p.name} (${p.projectCode})` }))}
                        value={selectedProjectId}
                        onChange={(id) => setSelectedProjectId(id)}
                      />
                    </div>

                    {selectedProjectId && members.length > 0 && (
                      <button
                        onClick={handleExportProjectDetail}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm w-full sm:w-auto justify-center cursor-pointer h-[38px]"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Detail ke Excel</span>
                      </button>
                    )}
                  </div>

                  {selectedProjectId ? (
                    isLoadingProjectDetails ? (
                      <div className="flex items-center justify-center min-h-[250px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-secondary text-sm">Memuat detail project...</span>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
                        Tidak ada member yang teralokasi ke project ini.
                      </div>
                    ) : (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Team</span>
                              <span className="text-xl font-bold text-on-background">{members.length} Orang</span>
                            </div>
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Mandays</span>
                              <span className="text-xl font-bold text-emerald-600">{projectTotalAktual.toFixed(1)} md</span>
                            </div>
                          </div>
                        </div>

                        {/* Detail Table */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3">
                          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                            <h3 className="font-bold text-on-background text-sm">Rekap Mandays Per Member</h3>
                            <span className="text-xs text-secondary font-mono">Total {projectMemberDetails.length} baris</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                  <th className="px-6 py-3.5">Nama Member</th>
                                  <th className="px-6 py-3.5">Role</th>
                                  <th className="px-6 py-3.5 text-center">Jumlah Task</th>
                                  <th className="px-6 py-3.5 text-right">Mandays (dari Tasks)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/60 font-medium">
                                {projectMemberDetails.map((m) => (
                                  <tr key={m.id} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-on-background">{m.userName}</span>
                                        <span className="text-[10px] text-secondary">{m.userEmail}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                        {m.roleName}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary">
                                      {m.activityCount}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                                      {m.actualMandays.toFixed(1)} md
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-bold bg-surface-container-high/20 border-t border-outline-variant text-on-background">
                                  <td className="px-6 py-4" colSpan={2}>Grand Total</td>
                                  <td className="px-6 py-4 text-center font-mono text-secondary">
                                    {activities.filter(a => a.assignedToId).length} tasks
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-primary">
                                    {projectTotalAktual.toFixed(1)} md
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Role Table */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3 max-w-2xl">
                          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
                            <h3 className="font-bold text-on-background text-sm flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-primary" />
                              <span>Ringkasan Per Role</span>
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                  <th className="px-6 py-3.5">Role</th>
                                  <th className="px-6 py-3.5 text-center">Jumlah Member</th>
                                  <th className="px-6 py-3.5 text-right">Total Mandays</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/60 font-medium">
                                {projectRoleSummaries.map((r, index) => (
                                  <tr key={index} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-on-background">{r.roleName}</td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary">{r.count} orang</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{r.aktual.toFixed(1)} md</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
                      Silakan pilih project di atas untuk melihat detail.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            /* SUPPORT REPORTS SECTION */
            <div className="flex flex-col gap-6">
              {/* Segmented Control Sub-Tabs (OVERVIEW first!) */}
              <div className="flex gap-2 p-1 bg-surface-container-low border border-outline-variant/60 rounded-xl w-fit shadow-inner">
                <button
                  onClick={() => setSupportSubTab('overview')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === 'overview'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                  }`}
                >
                  Overview Semua Tiket
                </button>
                <button
                  onClick={() => setSupportSubTab('detail')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === 'detail'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                  }`}
                >
                  Fokus Detail Tiket
                </button>
              </div>

              {supportSubTab === 'overview' ? (
                /* Subtab: Support Overview (Laporan Keseluruhan) */
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* Filters Card */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-outline-variant/60 pb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Filter Rentang Waktu & Status (Support)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Tanggal Mulai</label>
                        <input
                          type="date"
                          value={supportStartDate}
                          onChange={(e) => setSupportStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Tanggal Selesai</label>
                        <input
                          type="date"
                          value={supportEndDate}
                          onChange={(e) => setSupportEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-on-background">Status Tiket</label>
                        <select
                          value={supportStatusFilter}
                          onChange={(e) => setSupportStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                          <option value="ALL">Semua Status Support</option>
                          <option value="OPEN">OPEN</option>
                          <option value="IN PROGRESS">IN PROGRESS</option>
                          <option value="DEV DONE">DEV DONE</option>
                          <option value="SIT DONE">SIT DONE</option>
                          <option value="UAT DONE">UAT DONE</option>
                          <option value="DONE">DONE</option>
                          <option value="ON HOLD">ON HOLD</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-outline-variant/60 pt-4 mt-2">
                      <button
                        onClick={() => {
                          setSupportStartDate('');
                          setSupportEndDate('');
                          setSupportStatusFilter('ALL');
                        }}
                        className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-xs font-bold cursor-pointer"
                      >
                        Reset Filter
                      </button>

                      <button
                        onClick={() => handleExportOverallSupport(overallSupportFiltered)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Rekap Support</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingOverall ? (
                    <div className="flex items-center justify-center min-h-[250px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-secondary text-sm">Menghitung mandays support...</span>
                    </div>
                  ) : (
                    <>
                      {/* Metric Card */}
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4 max-w-md">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Mandays Semua Support</span>
                          <span className="text-xl font-bold text-amber-600">{(overallSupportFiltered.reduce((sum, t) => sum + t.hoursSpent, 0) / 8).toFixed(2)} md</span>
                          <span className="text-[10px] text-secondary block mt-0.5">Dari {overallSupportFiltered.length} tiket ({overallSupportFiltered.reduce((sum, t) => sum + t.hoursSpent, 0).toFixed(1)} jam)</span>
                        </div>
                      </div>

                      {/* Overview Table */}
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3">
                        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
                          <h3 className="font-bold text-on-background text-sm">Rekap Mandays Semua Support Ticket</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                <th className="px-6 py-3.5">Ticket Code</th>
                                <th className="px-6 py-3.5">Nama Project</th>
                                <th className="px-6 py-3.5">Judul Issue</th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-center">Jumlah Assignee</th>
                                <th className="px-6 py-3.5 text-right">Total Hours</th>
                                <th className="px-6 py-3.5 text-right">Total Mandays</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/60 font-medium">
                              {overallSupportFiltered.length > 0 ? (
                                overallSupportFiltered.map((t) => (
                                  <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-secondary">{t.ticketCode}</td>
                                    <td className="px-6 py-4 text-secondary">{t.projectName}</td>
                                    <td className="px-6 py-4 font-bold text-on-background">{t.issueTitle}</td>
                                    <td className="px-6 py-4 text-secondary">{t.customer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                        {t.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary">{t.assigneeCount} orang</td>
                                    <td className="px-6 py-4 text-right font-mono text-secondary">{t.hoursSpent.toFixed(1)} jam</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{t.totalMandays.toFixed(2)} md</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={8} className="px-6 py-8 text-center text-secondary">
                                    Tidak ada data tiket support yang sesuai dengan filter.
                                  </td>
                                </tr>
                              )}
                              {overallSupportFiltered.length > 0 && (
                                <tr className="font-bold bg-surface-container-high/20 border-t border-outline-variant text-on-background">
                                  <td className="px-6 py-4" colSpan={5}>Total Support Mandays</td>
                                  <td className="px-6 py-4 text-center font-mono text-secondary">
                                    {overallSupportFiltered.reduce((sum, t) => sum + t.assigneeCount, 0)} orang
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-secondary">
                                    {overallSupportFiltered.reduce((sum, t) => sum + t.hoursSpent, 0).toFixed(1)} jam
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-primary">
                                    {(overallSupportFiltered.reduce((sum, t) => sum + t.hoursSpent, 0) / 8).toFixed(2)} md
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Subtab: Support Detail */
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* Selector Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
                    <div className="w-full sm:max-w-md">
                      <SearchableSelect
                        label="Pilih Tiket Support"
                        placeholder="-- Pilih Tiket Support --"
                        options={tickets.map((t: any) => ({
                          id: t.id,
                          label: `[${t.ticketCode}] ${t.issueTitle.length > 50 ? `${t.issueTitle.substring(0, 50)}...` : t.issueTitle}`
                        }))}
                        value={selectedTicketId}
                        onChange={(id) => setSelectedTicketId(id)}
                      />
                    </div>

                    {selectedTicketId && assignees.length > 0 && (
                      <button
                        onClick={handleExportSupportDetail}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-bold shadow-sm w-full sm:w-auto justify-center cursor-pointer h-[38px]"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Detail ke Excel</span>
                      </button>
                    )}
                  </div>

                  {selectedTicketId ? (
                    isLoadingTicketDetails ? (
                      <div className="flex items-center justify-center min-h-[250px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-secondary text-sm">Memuat detail tiket...</span>
                      </div>
                    ) : assignees.length === 0 ? (
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
                        Tidak ada tim member yang dialokasikan ke tiket ini.
                      </div>
                    ) : (
                      <>
                        {/* Ticket Context */}
                        {ticket && (
                          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-bold text-on-background text-sm">
                              <Briefcase className="w-4 h-4 text-primary" />
                              <span>{ticket.masterProject?.name || 'Project Tanpa Nama'}</span>
                              <span className="text-xs font-mono text-secondary px-2 py-0.5 bg-background rounded border border-outline-variant">
                                {ticket.ticketCode}
                              </span>
                            </div>
                            <p className="text-xs text-secondary">
                              <strong className="text-on-background">Issue:</strong> {ticket.issueTitle}
                            </p>
                          </div>
                        )}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Assignee</span>
                              <span className="text-xl font-bold text-on-background">{assignees.length} Orang</span>
                            </div>
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Total Jam Kerja</span>
                              <span className="text-xl font-bold text-on-background">{supportTotalHours.toFixed(1)} jam</span>
                            </div>
                          </div>
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Konversi Mandays</span>
                              <span className="text-xl font-bold text-emerald-600">{supportTotalMandays.toFixed(2)} md</span>
                            </div>
                          </div>
                        </div>

                        {/* Assignees Table */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3">
                          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                            <h3 className="font-bold text-on-background text-sm">Rekap Jam Kerja & Mandays Assignee</h3>
                            <span className="text-xs text-secondary font-mono">Total {assignees.length} orang</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                  <th className="px-6 py-3.5">Nama Assignee</th>
                                  <th className="px-6 py-3.5">Role</th>
                                  <th className="px-6 py-3.5">Status Kerja</th>
                                  <th className="px-6 py-3.5 text-right">Hours Logged</th>
                                  <th className="px-6 py-3.5 text-right">Konversi Mandays</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/60 font-medium">
                                {assignees.map((a: any) => (
                                  <tr key={a.id} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-on-background">{a.user?.fullName || `User ID: ${a.userId}`}</span>
                                        <span className="text-[10px] text-secondary">{a.user?.email || ''}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                        {a.role?.name || 'Resource'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                        a.status === 'DONE'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : a.status === 'IN PROGRESS'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-surface text-secondary border-outline-variant'
                                      }`}>
                                        {a.status || 'OPEN'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-secondary">
                                      {(a.hoursSpent || 0).toFixed(1)} jam
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                                      {((a.hoursSpent || 0) / 8).toFixed(2)} md
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-bold bg-surface-container-high/20 border-t border-outline-variant text-on-background">
                                  <td className="px-6 py-4" colSpan={3}>Grand Total</td>
                                  <td className="px-6 py-4 text-right font-mono text-secondary">
                                    {supportTotalHours.toFixed(1)} jam
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-primary">
                                    {supportTotalMandays.toFixed(2)} md
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Role Table */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col gap-3 max-w-2xl">
                          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low">
                            <h3 className="font-bold text-on-background text-sm flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-primary" />
                              <span>Ringkasan Per Role</span>
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                                  <th className="px-6 py-3.5">Role</th>
                                  <th className="px-6 py-3.5 text-center">Jumlah Member</th>
                                  <th className="px-6 py-3.5 text-right">Total Jam Kerja</th>
                                  <th className="px-6 py-3.5 text-right">Total Konversi Mandays</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/60 font-medium">
                                {supportRoleSummaries.map((r, index) => (
                                  <tr key={index} className="hover:bg-surface-container-low/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-on-background">{r.roleName}</td>
                                    <td className="px-6 py-4 text-center font-mono text-secondary">{r.count} orang</td>
                                    <td className="px-6 py-4 text-right font-mono text-secondary">{r.hours.toFixed(1)} jam</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{r.mandays.toFixed(2)} md</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
                      Silakan pilih tiket support di atas untuk melihat detail.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
