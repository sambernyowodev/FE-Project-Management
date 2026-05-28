import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { useGetMasterProjects, useDeleteMasterProject } from '@/modules/master/projects/hooks/useMasterProjects';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { MasterProject } from '@/modules/master/projects/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export function MasterProjectListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetMasterProjects({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const deleteMutation = useDeleteMasterProject();

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

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus master project "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<MasterProject, any>[] = [
    {
      id: 'projectCode',
      header: 'Project Code',
      accessorKey: 'projectCode',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary font-bold">{row.original.projectCode}</span>
      ),
    },
    {
      id: 'name',
      header: 'Project Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.name}</span>
      ),
    },
    {
      id: 'platform',
      header: 'Platform',
      accessorKey: 'platform',
      cell: ({ row }) => (
        <span className="text-secondary text-sm">{row.original.platform || '-'}</span>
      ),
    },
    {
      id: 'isActive',
      header: 'Status',
      accessorKey: 'isActive',
      meta: {
        filterOptions: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${row.original.isActive
            ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
            : 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
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
            onClick={() => navigate(`/master/projects/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Master Project"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id, row.original.name)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Master Project"
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
          <h1 className="text-3xl font-bold text-on-background mb-1">Master Projects</h1>
          <p className="text-secondary text-sm">Manage the enterprise-wide catalog of projects and systems.</p>
        </div>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search master projects by name, code, or platform..."
        onAdd={() => navigate('/master/projects/new')}
        addLabel="New Master Project"
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="master-projects-list"
      />
    </div>
  );
}
