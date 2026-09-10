import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetProject,
  useGetProjects
} from '@/modules/projects/hooks/useProjects';
import {
  useGetProjectActivities
} from '@/modules/projects/hooks/useProjectActivities';
import {
  useGetProjectMembers
} from '@/modules/projects/hooks/useProjects';
import { useGetHolidays } from '@/modules/master/holidays/hooks/useHolidays';
import { GanttChart } from './components/GanttChart';
import { TaskTable } from './components/TaskTable';
import { ResourcePanel } from './components/ResourcePanel';
import { ActivityFormModal } from './components/ActivityFormModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { ProjectStatus } from '@/shared/constants/enums';
import { calculateProjectProgress, calculateProjectSchedule } from '@/shared/lib/project-calculations';
import {
  Calendar,
  Database,
  ExternalLink,
  Plus,
  BarChart4,
  ListTodo,
  Briefcase,
  CalendarDays,
  Edit,
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { formatDate } from '@/shared/lib/formatter';
import {
  generateTimelineExcelTemplate,
  exportTimelineGanttToExcel,
  parseTimelineExcel,
  type ParsedExcelRow
} from '@/shared/lib/excel-helpers';
import type { ProjectActivity } from '@/modules/projects/types';

export function ProjectTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasRouteId = Boolean(id);

  // 1. Fetch Projects for Dropdown Selection
  const { data: projectsRes, isLoading: isProjectsListLoading } = useGetProjects();
  const projects = projectsRes?.data || [];

  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Set initial selected project ID based on route param or first project in list
  useEffect(() => {
    if (hasRouteId) {
      setSelectedProjectId(id || null);
    } else if (projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [id, hasRouteId, projects, selectedProjectId]);

  // 2. Fetch Details for Selected Project
  const { data: project, isLoading: isProjectLoading } = useGetProject(selectedProjectId || '');

  // 3. Fetch Activities & Members & Master Holidays
  const { data: activities = [], isLoading: isActivitiesLoading } = useGetProjectActivities(selectedProjectId || '');
  const { data: members = [], isLoading: isMembersLoading } = useGetProjectMembers(selectedProjectId || '');
  const { data: holidays = [] } = useGetHolidays();

  // 4. View Modes (Gantt vs Table List)
  const [activeTab, setActiveTab] = useState<'gantt' | 'list'>('gantt');

  // Calculate dynamic metrics from activities (Progress, Mandays, Actual Schedule)
  const calculatedMetrics = useMemo(() => {
    const totalInputMandays = activities.reduce((acc, curr) => acc + Math.round(curr.mandays || 0), 0);
    const calculatedProgress = calculateProjectProgress(activities);
    const { actualStart, actualEnd } = calculateProjectSchedule(activities, project?.startDate, project?.endDate);

    return {
      progressPct: calculatedProgress,
      totalInputMandays: Math.round(totalInputMandays),
      actualStart,
      actualEnd,
    };
  }, [activities, project]);

  // 5. Activity Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProjectActivity | null>(null);
  const [subActivityParentId, setSubActivityParentId] = useState<string | null>(null);

  // 6. Manage Team Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // 7. Excel Import & Template Download State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedExcelRow[]>([]);
  const [parsedResourceRoles, setParsedResourceRoles] = useState<Record<string, string>>({});
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  const handleDownloadTemplate = () => {
    if (!project) return;
    generateTimelineExcelTemplate(project, activities, members);
  };

  const handleDownloadGanttExcel = () => {
    if (!project) return;
    exportTimelineGanttToExcel(project, activities, members, holidays);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      const res = await parseTimelineExcel(file, activities, members);
      setParsedRows(res.rows);
      setParsedResourceRoles(res.resourceRoles || {});
      setIsImportModalOpen(true);
    } catch (err: any) {
      alert('Gagal membaca file Excel. Pastikan format file .xlsx sesuai.');
    } finally {
      setIsParsingExcel(false);
      e.target.value = ''; // reset input file
    }
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setSubActivityParentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: ProjectActivity) => {
    setEditingActivity(activity);
    setSubActivityParentId(null);
    setIsModalOpen(true);
  };

  const handleOpenAddSubModal = (parentId: string) => {
    setEditingActivity(null);
    setSubActivityParentId(parentId);
    setIsModalOpen(true);
  };

  const isLoading = isProjectLoading || isProjectsListLoading;

  if (isLoading && !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat data project...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Upper Navigation and Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-3">
          {hasRouteId && (
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
              title="Kembali ke Daftar Project"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">Project Timeline & Gantt</h1>
            <p className="text-secondary text-sm">Detail tahapan, jadwal pengerjaan, progress, dan alokasi resource project.</p>
          </div>
        </div>
      </div>

      {project ? (
        <>
          {/* Project Summary Overview Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-outline-variant/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-on-background">{project.name}</h2>
                    <span className="text-xs font-mono text-secondary px-2 py-0.5 bg-surface rounded border border-outline-variant">
                      {project.projectCode}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-4">
                    <span>Customer: <strong className="text-on-background">{project.customer || '-'}</strong></span>
                    <span>Platform: <strong className="text-on-background">{project.platform || '-'}</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={project.status || ProjectStatus.PLANNING} />
                {project.timelineRemark && (
                  <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-semibold">
                    {project.timelineRemark}
                  </span>
                )}

                {/* Download Template Excel */}
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-emerald-600/30 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  title="Download Format Template Excel Timeline"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Download Template</span>
                </button>

                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-outline-variant rounded-lg hover:bg-surface-container-low text-xs font-bold text-secondary transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Progress and Mandays */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Overall Progress & Mandays</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculatedMetrics.progressPct}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-on-background font-mono">{calculatedMetrics.progressPct}%</span>
                </div>
                <div className="text-xs text-secondary mt-1 flex justify-between font-medium">
                  <span>Mandays Rencana: <strong>{Math.round(project.totalMandays || 0)} md</strong></span>
                  <span>Mandays Actual: <strong>{Math.round(calculatedMetrics.totalInputMandays)} md</strong></span>
                </div>
              </div>

              {/* Planned Schedule */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Jadwal Rencana</span>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-background">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>{formatDate(project.startDate, 'short')} - {formatDate(project.endDate, 'short')}</span>
                </div>
                <span className="text-[10px] text-secondary font-medium">Jadwal yang disepakati di awal project</span>
              </div>

              {/* Actual Schedule */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Jadwal Realisasi (Actual)</span>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-background">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>{formatDate(calculatedMetrics.actualStart, 'short')} - {formatDate(calculatedMetrics.actualEnd, 'short')}</span>
                </div>
                <span className="text-[10px] text-secondary font-medium">Otomatis dari awal & akhir task timeline</span>
              </div>

              {/* Team PIC Allocation */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">PIC Penanggung Jawab</span>
                <div className="text-xs flex flex-col gap-1 text-on-background font-medium">
                  <div className="flex justify-between">
                    <span className="text-secondary">Client PIC:</span>
                    <span className="font-semibold">{project.picClient || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Internal PIC:</span>
                    <span className="font-semibold">{project.picInternal || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Overview Footer: Links & Remarks */}
            {(project.repositoryLink || project.timelineLink || project.remarks) && (
              <div className="border-t border-outline-variant/60 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  {project.repositoryLink && (
                    <a
                      href={project.repositoryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary/30 hover:bg-surface-container-low text-secondary font-semibold rounded-lg transition-all"
                    >
                      <Database className="w-3.5 h-3.5 text-secondary" />
                      <span>Link Repository</span>
                      <ExternalLink className="w-3 h-3 text-secondary/60" />
                    </a>
                  )}
                  {project.timelineLink && (
                    <a
                      href={project.timelineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary/30 hover:bg-surface-container-low text-secondary font-semibold rounded-lg transition-all"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-secondary" />
                      <span>Link Timeline</span>
                      <ExternalLink className="w-3 h-3 text-secondary/60" />
                    </a>
                  )}
                </div>
                {project.remarks && (
                  <p className="text-secondary italic font-medium max-w-lg truncate">
                    Catatan: {project.remarks}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Left/Middle Column - Gantt & Task Table */}
            <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">

              {/* Toolbar and View Tabs */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 shadow-sm">

                {/* View Switcher Tabs */}
                <div className="flex items-center gap-1 p-1 bg-surface-container-high/70 rounded-lg w-full sm:w-auto shrink-0 border border-outline-variant/30">
                  <button
                    onClick={() => setActiveTab('gantt')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'gantt'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                      }`}
                  >
                    <BarChart4 className="w-4 h-4" />
                    <span>Gantt Chart View</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-background'
                      }`}
                  >
                    <ListTodo className="w-4 h-4" />
                    <span>Task List View</span>
                  </button>
                </div>

                {/* Actions Toolbar (Excel Actions & Add Task) */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                  {/* Download Timeline Gantt Chart ke Excel */}
                  <button
                    onClick={handleDownloadGanttExcel}
                    className="flex items-center gap-2 px-3.5 py-2 border border-emerald-600/30 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-lg transition-all text-xs font-bold shadow-xs cursor-pointer"
                    title="Download Timeline Gantt Chart ke Excel dengan pewarnaan per cell (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Export Gantt to Excel</span>
                  </button>

                  {/* Upload Excel */}
                  <label className="flex items-center gap-1.5 px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-500/20 transition-all text-xs font-semibold shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>{isParsingExcel ? 'Membaca...' : 'Upload Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsingExcel}
                    />
                  </label>

                  {/* Separator Divider */}
                  <div className="hidden sm:block h-6 w-px bg-outline-variant/60 mx-1"></div>

                  {/* Add Task Button */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-xs font-bold shadow-sm justify-center cursor-pointer ml-auto sm:ml-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Tambah Aktivitas</span>
                  </button>
                </div>
              </div>

              {/* View Components */}
              {isActivitiesLoading ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary h-64 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span>Memuat timeline aktivitas...</span>
                </div>
              ) : activeTab === 'gantt' ? (
                <GanttChart
                  project={{
                    name: project.name,
                    startDate: project.startDate || undefined,
                    endDate: project.endDate || undefined
                  }}
                  activities={activities}
                  members={members}
                  holidays={holidays}
                />
              ) : (
                <TaskTable
                  projectId={project.id}
                  activities={activities}
                  members={members}
                  onEditActivity={handleOpenEditModal}
                  onAddSubActivity={handleOpenAddSubModal}
                />
              )}
            </div>

            {/* Right Column - Team Resources Sidebar */}
            <div className="lg:col-span-1 h-[676px] lg:sticky lg:top-6">
              {isMembersLoading ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary h-full flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span>Memuat alokasi team...</span>
                </div>
              ) : (
                <ResourcePanel
                  members={members}
                  activities={activities}
                  onManageTeam={() => setIsManageModalOpen(true)}
                />
              )}
            </div>
          </div>

          {/* Form Modal for CRUD Activities */}
          <ActivityFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            projectId={project.id}
            activity={editingActivity}
            parentId={subActivityParentId}
            members={members}
            activities={activities}
          />

          {/* Modal for Managing Team Members */}
          <ManageMembersModal
            isOpen={isManageModalOpen}
            onClose={() => setIsManageModalOpen(false)}
            projectId={project.id}
            members={members}
            activities={activities}
          />

          {/* Modal for Preview & Edit Excel Data */}
          <ExcelImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            projectId={project.id}
            parsedRows={parsedRows}
            resourceRoles={parsedResourceRoles}
            members={members}
            existingActivities={activities}
          />
        </>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
          Project tidak ditemukan. Silakan pilih project lain dari dropdown di atas.
        </div>
      )}
    </div>
  );
}
