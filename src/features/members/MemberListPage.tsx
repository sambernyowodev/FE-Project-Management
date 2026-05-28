import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { useGetUsers, useDeleteUser } from '@/modules/users/hooks/useUsers';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { User } from '@/modules/users/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export function MemberListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetUsers({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const deleteMutation = useDeleteUser();

  const users = data?.data || [];
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

  const handleDeactivate = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan member "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<User, any>[] = [
    {
      id: 'employeeId',
      header: 'Employee ID',
      accessorKey: 'employeeId',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.employeeId || '-'}</span>
      ),
    },
    {
      id: 'fullName',
      header: 'Full Name',
      accessorKey: 'fullName',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-on-primary-container">
              {(row.original.fullName || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-on-background">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <span className="text-secondary text-sm">{row.original.email}</span>
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
            onClick={() => navigate(`/members/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Member"
          >
            <Edit className="w-4 h-4" />
          </button>
          {row.original.isActive && (
            <button
              onClick={() => handleDeactivate(row.original.id, row.original.fullName)}
              className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
              title="Deactivate Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Members</h1>
          <p className="text-secondary text-sm">Manage master data for project team members and resources.</p>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search members by name, email, or ID..."
        onAdd={() => navigate('/members/new')}
        addLabel="New Member"
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="members-list"
      />
    </div>
  );
}
