import { useState } from 'react';
import { useGetSalesOrders } from '@/modules/sales-orders/hooks/useSalesOrders';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { SalesOrder } from '@/modules/sales-orders/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { SalesOrderStatus } from '@/shared/constants/enums';

export function SOListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetSalesOrders({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const sos = data?.data || [];
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

  const columns: ColumnDef<SalesOrder, any>[] = [
    {
      id: 'soNumber',
      header: 'SO Number',
      accessorKey: 'soNumber',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.soNumber}</span>
      ),
    },
    {
      id: 'soName',
      header: 'Name',
      accessorKey: 'soName',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.soName}</span>
      ),
    },
    {
      id: 'po.poNumber',
      header: 'PO Number',
      accessorKey: 'po.poNumber',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.po?.poNumber || '-'}</span>
      ),
    },
    {
      id: 'project.project.name',
      header: 'Project',
      accessorKey: 'project.project.name',
      cell: ({ row }) => (
        <span className="text-secondary">{row.original.project?.project?.name || '-'}</span>
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
          { label: 'Draft', value: SalesOrderStatus.DRAFT },
          { label: 'Active', value: SalesOrderStatus.ACTIVE },
          { label: 'In Progress', value: SalesOrderStatus.IN_PROGRESS },
          { label: 'Delivered', value: SalesOrderStatus.DELIVERED },
          { label: 'Invoiced', value: SalesOrderStatus.INVOICED },
          { label: 'Paid', value: SalesOrderStatus.PAID },
          { label: 'Closed', value: SalesOrderStatus.CLOSED },
          { label: 'Cancelled', value: SalesOrderStatus.CANCELLED },
        ],
      },
      cell: ({ row }) => (
        <StatusBadge status={row.original.status || SalesOrderStatus.DRAFT} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Sales Orders</h1>
        <p className="text-secondary text-sm">Track sales orders tied to POs.</p>
      </div>

      <DataTable
        data={sos}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search SOs..."
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="sales-orders-list"
      />
    </div>
  );
}
