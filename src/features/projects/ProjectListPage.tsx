import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { useGetProjects, useDeleteProject } from '@/modules/projects/hooks/useProjects';
import { useGetPurchaseOrders } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import { useGetCompanies } from '@/modules/master/companies/hooks/useCompanies';
import { useGetDepartments } from '@/modules/master/departments/hooks/useDepartments';
import { useGetBusinessOwners } from '@/modules/master/business-owners/hooks/useBusinessOwners';
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingProject, setDeletingProject] = useState<{ id: string; code: string } | null>(null);

  // Active filter values from column filters
  const selectedCompany = (columnFilters.find(f => f.id === 'companyId')?.value as string) || '';
  const selectedDepartment = (columnFilters.find(f => f.id === 'departmentId')?.value as string) || '';

  // Master data queries
  const { data: companies = [] } = useGetCompanies();
  const { data: rawDepartments = [] } = useGetDepartments(selectedCompany || undefined);

  // Departments strictly based on selectedCompany
  const departments = selectedCompany
    ? rawDepartments.filter(d => !d.companyId || d.companyId === selectedCompany)
    : [];

  // Business owners strictly based on BOTH selectedCompany and selectedDepartment
  const { data: rawBusinessOwners = [] } = useGetBusinessOwners({
    companyId: selectedCompany || undefined,
    departmentId: selectedDepartment || undefined,
  });

  const businessOwners = (selectedCompany && selectedDepartment)
    ? rawBusinessOwners.filter(b => {
        const matchesDept = b.departmentId === selectedDepartment;
        const matchesComp = !selectedCompany ||
          b.department?.companyId === selectedCompany ||
          b.department?.company?.id === selectedCompany ||
          departments.some(d => d.id === b.departmentId && (!d.companyId || d.companyId === selectedCompany));
        return matchesDept && matchesComp;
      })
    : [];

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

  const companyFilterOptions = companies.map(c => ({
    label: c.name,
    value: c.id,
  }));

  const departmentFilterOptions = departments.map(d => ({
    label: d.name,
    value: d.id,
  }));

  const businessOwnerFilterOptions = businessOwners.map(b => ({
    label: b.name + (b.title ? ` (${b.title})` : ''),
    value: b.id,
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
    const prevCompany = (columnFilters.find(f => f.id === 'companyId')?.value as string) || '';
    const newCompany = (filterState.find(f => f.id === 'companyId')?.value as string) || '';

    const prevDept = (columnFilters.find(f => f.id === 'departmentId')?.value as string) || '';
    const newDept = (filterState.find(f => f.id === 'departmentId')?.value as string) || '';

    let cleanedFilters = [...filterState];

    // If company changed, reset department and pic client filters
    if (newCompany !== prevCompany) {
      cleanedFilters = cleanedFilters.filter(f => f.id !== 'departmentId' && f.id !== 'businessOwnerId');
    }

    // If department changed, reset pic client filter
    if (newDept !== prevDept) {
      cleanedFilters = cleanedFilters.filter(f => f.id !== 'businessOwnerId');
    }

    setColumnFilters(cleanedFilters);

    const nextFilters: Record<string, any> = {};
    cleanedFilters.forEach(f => {
      if (f.value !== undefined && f.value !== null && f.value !== '') {
        nextFilters[f.id] = f.value;
      }
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
        <div className="flex flex-col">
          <span className="font-semibold text-on-background">{row.original.name}</span>
          <span className="text-xs text-secondary font-mono">{row.original.projectCode}</span>
        </div>
      ),
    },
    {
      id: 'companyId',
      header: 'Company',
      accessorKey: 'companyId',
      meta: {
        filterOptions: companyFilterOptions,
        filterPlaceholder: 'All Company',
      },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">
          {row.original.company?.name || row.original.customer || '-'}
        </span>
      ),
    },
    {
      id: 'departmentId',
      header: 'Department',
      accessorKey: 'departmentId',
      meta: {
        filterOptions: departmentFilterOptions,
        filterDisabled: !selectedCompany,
        filterPlaceholder: !selectedCompany ? '-- Pilih Company dahulu --' : 'All Department',
      },
      cell: ({ row }) => (
        <span className="text-secondary">
          {row.original.department?.name || '-'}
        </span>
      ),
    },
    {
      id: 'businessOwnerId',
      header: 'PIC Client',
      accessorKey: 'businessOwnerId',
      meta: {
        filterOptions: businessOwnerFilterOptions,
        filterDisabled: !selectedDepartment,
        filterPlaceholder: !selectedCompany
          ? '-- Pilih Company dahulu --'
          : (!selectedDepartment ? '-- Pilih Department dahulu --' : 'All PIC Client'),
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-on-background">
            {row.original.businessOwner?.name || row.original.picClient || '-'}
          </span>
          {row.original.businessOwner?.title && (
            <span className="text-[11px] text-secondary">
              {row.original.businessOwner.title}
            </span>
          )}
        </div>
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
        columnFilters={columnFilters}
        defaultShowFilters={true}
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


