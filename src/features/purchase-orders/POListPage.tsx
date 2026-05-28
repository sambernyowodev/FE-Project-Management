import { useState } from 'react';
import { useGetPurchaseOrders } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { PurchaseOrder } from '@/modules/purchase-orders/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { PurchaseOrderStatus } from '@/shared/constants/enums';

export function POListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

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
        <span className="font-semibold text-on-background">{row.original.poName}</span>
      ),
    },
    {
      id: 'project.name',
      header: 'Project',
      accessorKey: 'project.name',
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.project?.name || '-'}</span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessorKey: 'customer',
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.customer || '-'}</span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Total Value',
      accessorKey: 'totalAmount',
      meta: { className: 'text-right' },
      cell: ({ row }) => (
        <span className="font-medium text-on-background">{formatCurrency(row.original.totalAmount || 0)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      meta: {
        filterOptions: [
          { label: 'Draft', value: PurchaseOrderStatus.DRAFT },
          { label: 'Active', value: PurchaseOrderStatus.ACTIVE },
          { label: 'In Progress', value: PurchaseOrderStatus.IN_PROGRESS },
          { label: 'Completed', value: PurchaseOrderStatus.COMPLETED },
          { label: 'Closed', value: PurchaseOrderStatus.CLOSED },
          { label: 'Cancelled', value: PurchaseOrderStatus.CANCELLED },
        ],
      },
      cell: ({ row }) => (
        <StatusBadge status={row.original.status || PurchaseOrderStatus.DRAFT} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Purchase Orders</h1>
        <p className="text-secondary text-sm">Manage client POs and track budgets.</p>
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
        exportFilename="purchase-orders-list"
      />
    </div>
  );
}
