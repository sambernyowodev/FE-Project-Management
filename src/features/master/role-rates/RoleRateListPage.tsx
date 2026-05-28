import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { useGetRoleRates } from '@/modules/master/role-rates/hooks/useRoleRates';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { RoleRate } from '@/modules/master/role-rates/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export function RoleRateListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetRoleRates({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const rates = data?.data || [];
  const totalItems = data?.meta?.total || 0;

  const formatCurrency = (amount: number, currencyCode: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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

  const columns: ColumnDef<RoleRate, any>[] = [
    {
      id: 'role.name',
      header: 'Role',
      accessorKey: 'role.name',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.role?.name || '-'}</span>
      ),
    },
    {
      id: 'project.project.name',
      header: 'Project',
      accessorKey: 'project.project.name',
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.project?.project?.name || <span className="text-primary font-semibold">Global</span>}</span>
      ),
    },
    {
      id: 'ratePerManday',
      header: 'Rate / Manday',
      accessorKey: 'ratePerManday',
      meta: { className: 'text-right' },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">{formatCurrency(Number(row.original.ratePerManday || 0), row.original.currency)}</span>
      ),
    },
    {
      id: 'ratePerHour',
      header: 'Rate / Hour',
      accessorKey: 'ratePerHour',
      meta: { className: 'text-right' },
      cell: ({ row }) => (
        <span className="text-secondary">{formatCurrency(Number(row.original.ratePerHour || 0), row.original.currency)}</span>
      ),
    },
    {
      id: 'effectiveFrom',
      header: 'Effective From',
      accessorKey: 'effectiveFrom',
      cell: ({ row }) => (
        <span className="text-secondary">{formatDate(row.original.effectiveFrom)}</span>
      ),
    },
    {
      id: 'effectiveUntil',
      header: 'Effective Until',
      accessorKey: 'effectiveUntil',
      cell: ({ row }) => (
        <span className="text-secondary">{formatDate(row.original.effectiveUntil)}</span>
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
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
            onClick={() => navigate(`/master/role-rates/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Role Rate"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Role Rates</h1>
          <p className="text-secondary text-sm">Configure global and project-specific rates.</p>
        </div>
      </div>

      <DataTable
        data={rates}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search role rates..."
        onAdd={() => navigate('/master/role-rates/new')}
        addLabel="New Role Rate"
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="role-rates-list"
      />
    </div>
  );
}
