import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useGetPurchaseOrders, useDeletePurchaseOrder } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import { useGetCompanies } from '@/modules/master/companies/hooks/useCompanies';
import { useGetDepartments } from '@/modules/master/departments/hooks/useDepartments';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import type { PurchaseOrder } from '@/modules/purchase-orders/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export function POListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [deletingPo, setDeletingPo] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useDeletePurchaseOrder();
  const { data: companies = [] } = useGetCompanies();
  const { data: departments = [] } = useGetDepartments();

  const companyFilterOptions = companies.map(c => ({ label: c.name, value: c.id }));
  const departmentFilterOptions = departments.map(d => ({ label: d.name, value: d.id }));

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetPurchaseOrders({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const pos = data?.data || [];
  const totalItems = data?.meta?.total || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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

  const handleConfirmDelete = async () => {
    if (!deletingPo) return;
    try {
      await deleteMutation.mutateAsync(deletingPo.id);
      setDeletingPo(null);
      refetch();
    } catch {
      setDeletingPo(null);
    }
  };

  const columns: ColumnDef<PurchaseOrder, any>[] = [
    {
      id: 'poNumber',
      header: 'PO Number',
      accessorKey: 'poNumber',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.poNumber}</span>
      ),
    },
    {
      id: 'poName',
      header: 'Name',
      accessorKey: 'poName',
      cell: ({ row }) => (
        <span className="font-bold text-on-background">{row.original.poName}</span>
      ),
    },
    {
      id: 'companyId',
      header: 'Company',
      accessorKey: 'companyId',
      meta: {
        filterOptions: companyFilterOptions,
      },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">{row.original.company?.name || row.original.customer || '-'}</span>
      ),
    },
    {
      id: 'departmentId',
      header: 'Department',
      accessorKey: 'departmentId',
      meta: {
        filterOptions: departmentFilterOptions,
      },
      cell: ({ row }) => (
        <span className="font-medium text-secondary">{row.original.department?.name || '-'}</span>
      ),
    },
    {
      id: 'totalMandays',
      header: 'Total Mandays',
      accessorKey: 'totalMandays',
      meta: { filterType: 'number' },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">{row.original.totalMandays || 0}</span>
      ),
    },
    {
      id: 'allocatedMandays',
      header: 'Allocated Mandays',
      accessorKey: 'allocatedMandays',
      meta: { filterType: 'number' },
      cell: ({ row }) => (
        <span className="font-medium text-secondary">{row.original.allocatedMandays || 0}</span>
      ),
    },
    {
      id: 'remainingMandays',
      header: 'Remaining Mandays',
      accessorKey: 'remainingMandays',
      meta: { filterType: 'number' },
      cell: ({ row }) => {
        const val = row.original.remainingMandays || 0;
        const color = val < 0 ? 'text-error font-semibold' : val > 0 ? 'text-success font-semibold' : 'text-secondary';
        return <span className={color}>{val}</span>;
      },
    },
    {
      id: 'totalAmount',
      header: 'Total Value',
      accessorKey: 'totalAmount',
      meta: { className: 'text-right', filterType: 'number' },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">{formatCurrency(row.original.totalAmount || 0)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { className: 'text-center w-28' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/purchase-orders/${row.original.id}`)}
            className="p-1.5 text-secondary hover:text-primary transition-colors cursor-pointer rounded hover:bg-surface-container-high"
            title="Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/purchase-orders/${row.original.id}/edit`)}
            className="p-1.5 text-secondary hover:text-primary transition-colors cursor-pointer rounded hover:bg-surface-container-high"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingPo({ id: row.original.id, name: row.original.poName })}
            className="p-1.5 text-secondary hover:text-error transition-colors cursor-pointer rounded hover:bg-error/10"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Purchase Orders</h1>
          <p className="text-secondary text-sm">Manage client POs, assign projects, and track budgets.</p>
        </div>
      </div>

      <DataTable
        data={pos}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search POs..."
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        onAdd={() => navigate('/purchase-orders/new')}
        addLabel="Create PO"
        exportFilename="purchase-orders-list"
      />

      {/* Confirm Dialog for Delete PO */}
      <ConfirmDialog
        isOpen={Boolean(deletingPo)}
        onClose={() => setDeletingPo(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Purchase Order?"
        message={`Apakah Anda yakin ingin menghapus PO "${deletingPo?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
