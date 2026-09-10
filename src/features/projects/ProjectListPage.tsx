import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { useGetProjects, useDeleteProject } from '@/modules/projects/hooks/useProjects';
import { useGetPurchaseOrders } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import type { Project } from '@/modules/projects/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { ProjectStatus } from '@/shared/constants/enums';
import { formatDate } from '@/shared/lib/formatter';


export function ProjectListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [deletingProject, setDeletingProject] = useState<{ id: string; code: string } | null>(null);

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetProjects({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const { data: poData } = useGetPurchaseOrders({ perPage: 100 });
  const purchaseOrders = poData?.data || [];

  const deleteMutation = useDeleteProject();

  const poFilterOptions = purchaseOrders.map(po => ({
    label: po.poNumber || '-',
    value: po.id,
  }));

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

  const handleConfirmDelete = () => {
    if (!deletingProject) return;
    deleteMutation.mutate(deletingProject.id, {
      onSuccess: () => {
        setDeletingProject(null);
        refetch();
      },
      onError: () => {
        setDeletingProject(null);
      }
    });
  };

  const columns: ColumnDef<Project, any>[] = [
    {
      id: 'name',
      header: 'Project Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.name}</span>
      ),
    },
    {
      id: 'poId',
      header: 'PO Number',
      accessorKey: 'poNumber',
      meta: {
        filterOptions: poFilterOptions,
      },
      cell: ({ row }) => (
        <span className="font-semibold text-secondary">{row.original.poNumber || '-'}</span>
      ),
    },
    {
      id: 'startDate',
      header: 'Date',
      accessorKey: 'startDate',
      meta: {
        filterType: 'date',
      },
      cell: ({ row }) => (
        <span className="text-secondary">{formatDate(row.original.startDate, 'short')}</span>
      ),
    },
    {
      id: 'actualMandays',
      header: 'Mandays Actual',
      accessorKey: 'actualMandays',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary">
          {Math.round(row.original.actualMandays || 0)} md
        </span>
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
          { label: 'Pentest', value: ProjectStatus.PENTEST },
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
            onClick={() => setDeletingProject({ id: row.original.id, code: row.original.projectCode })}
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

      {/* Confirm Dialog for Delete Project */}
      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Project?"
        message={`Apakah Anda yakin ingin menghapus project "${deletingProject?.code || ''}"? Seluruh data aktivitas dan timeline project ini akan dihapus.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
