import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { useDeleteProject, useGetProjects } from '@/modules/projects/hooks/useProjects';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { Project } from '@/modules/projects/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ProjectStatus, ProjectType } from '@/shared/constants/enums';


export function ProjectListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetProjects({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const deleteMutation = useDeleteProject();

  const projects = data?.data || [];
  const totalItems = data?.meta?.total || 0;

  const handleSortChange = (sortingState: SortingState) => {
    if (sortingState.length > 0) {
      const { id, desc } = sortingState[0];
      setSort(desc ? `-${id}` : id);
    } else {
      setSort(undefined);
    }
  };

  const handleFilterChange = (filterState: ColumnFiltersState) => {
    const nextFilters: Record<string, any> = {};
    filterState.forEach(f => {
      nextFilters[f.id] = f.value;
    });
    setFilters(nextFilters);
  };

  const handleDelete = (id: number, projectCode: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus project ${projectCode}?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<Project, any>[] = [
    {
      id: 'projectCode',
      header: 'Project Code',
      accessorKey: 'projectCode',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.projectCode || `PRJ-${row.original.id}`}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.name}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      meta: {
        filterOptions: [
          { label: 'New', value: ProjectType.NEW },
          { label: 'Support', value: ProjectType.SUPPORT },
        ],
      },
      cell: ({ row }) => {
        const type = row.original.type || ProjectType.NEW;
        const isSupport = type === ProjectType.SUPPORT;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center justify-center uppercase ${isSupport
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
            {type}
          </span>
        );
      },
    },
    {
      id: 'customer',
      header: 'Customer',
      accessorKey: 'picClient',
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.picClient || row.original.customer || '-'}</span>
      ),
    },
    {
      id: 'progressPct',
      header: 'Progress',
      accessorKey: 'progressPct',
      cell: ({ row }) => {
        const progress = row.original.progressPct || 0;
        return (
          <div className="flex items-center gap-3">
            <div className="w-24 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-350"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-secondary min-w-[28px]">{progress}%</span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      meta: {
        filterOptions: [
          { label: 'Planning', value: ProjectStatus.PLANNING },
          { label: 'In Progress', value: ProjectStatus.IN_PROGRESS },
          { label: 'SIT', value: ProjectStatus.SIT },
          { label: 'UAT', value: ProjectStatus.UAT },
          { label: 'FUT', value: ProjectStatus.FUT },
          { label: 'On Hold', value: ProjectStatus.ON_HOLD },
          { label: 'Closed', value: ProjectStatus.CLOSED },
          { label: 'Cancelled', value: ProjectStatus.CANCELLED },
        ],
      },
      cell: ({ row }) => (
        <StatusBadge status={row.original.status || ProjectStatus.PLANNING} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { className: 'text-right w-24' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 items-center">
          <button
            onClick={() => navigate(`/projects/${row.original.id}/timeline`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Timeline"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/projects/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-secondary hover:text-on-background transition-all cursor-pointer"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id, row.original.projectCode)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Projects</h1>
          <p className="text-secondary text-sm">Manage enterprise projects, timelines, and resources.</p>
        </div>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search projects..."
        onAdd={() => navigate('/projects/new')}
        addLabel="New Project"
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="project-list"
      />
    </div>
  );
}
