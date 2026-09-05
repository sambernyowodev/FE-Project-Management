import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Users } from 'lucide-react';
import {
  useGetSupportTickets,
  useDeleteSupportTicket
} from '@/modules/support/hooks/useSupportTickets';
import { useGetPurchaseOrders } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { SupportTicket } from '@/modules/support/types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { SupportTicketStatus } from '@/shared/constants/enums';
import { formatDate } from '@/shared/lib/formatter';

export function SupportListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [deletingTicket, setDeletingTicket] = useState<{ id: string; code: string } | null>(null);

  const filterString = Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;

  const { data, isLoading, refetch } = useGetSupportTickets({
    page: currentPage,
    perPage: 10,
    sort,
    search,
    filter: filterString,
  });

  const { data: poData } = useGetPurchaseOrders({ perPage: 100 });
  const purchaseOrders = poData?.data || [];

  const poFilterOptions = purchaseOrders.map(po => ({
    label: po.poNumber || '-',
    value: po.id,
  }));

  const deleteMutation = useDeleteSupportTicket();

  const tickets = data?.data || [];
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
    if (!deletingTicket) return;
    deleteMutation.mutate(deletingTicket.id, {
      onSuccess: () => {
        setDeletingTicket(null);
        refetch();
      },
      onError: () => {
        setDeletingTicket(null);
      }
    });
  };

  const columns: ColumnDef<SupportTicket, any>[] = [
    {
      id: 'ticketCode',
      header: 'Ticket Code',
      accessorKey: 'ticketCode',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-secondary">{row.original.ticketCode}</span>
      ),
    },
    {
      id: 'projectName',
      header: 'Project Name',
      accessorKey: 'projectName',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.projectName || '-'}</span>
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
      id: 'hoursSpent',
      header: 'Hours Spent',
      accessorKey: 'hoursSpent',
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const hours = Number(row.original.hoursSpent || 0);
        return (
          <span className="font-mono text-xs text-secondary">{hours.toFixed(1)} hrs</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      meta: {
        filterOptions: [
          { label: 'Open', value: SupportTicketStatus.OPEN },
          { label: 'In Progress', value: SupportTicketStatus.IN_PROGRESS },
          { label: 'Dev Done', value: SupportTicketStatus.DEV_DONE },
          { label: 'SIT Done', value: SupportTicketStatus.SIT_DONE },
          { label: 'UAT Done', value: SupportTicketStatus.UAT_DONE },
          { label: 'Done', value: SupportTicketStatus.DONE },
          { label: 'On Hold', value: SupportTicketStatus.ON_HOLD },
          { label: 'Cancelled', value: SupportTicketStatus.CANCELLED },
        ],
      },
      cell: ({ row }) => (
        <StatusBadge status={row.original.status || SupportTicketStatus.OPEN} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { className: 'text-right w-32' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 items-center">
          <button
            onClick={() => navigate(`/support/${row.original.id}/timeline`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Kelola Member"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/support/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-secondary hover:text-on-background transition-all cursor-pointer"
            title="Edit Ticket"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingTicket({ id: row.original.id, code: row.original.ticketCode })}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Ticket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Support Tickets</h1>
        <p className="text-secondary text-sm">Manage issues and track support hours.</p>
      </div>

      <DataTable
        data={tickets}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search tickets..."
        onAdd={() => navigate('/support/new')}
        addLabel="New Ticket"
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onRefresh={refetch}
        exportFilename="support-tickets-list"
      />

      {/* Confirm Dialog for Delete Ticket */}
      <ConfirmDialog
        isOpen={Boolean(deletingTicket)}
        onClose={() => setDeletingTicket(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Support Ticket?"
        message={`Apakah Anda yakin ingin menghapus tiket "${deletingTicket?.code || ''}"? Seluruh alokasi jam dan riwayat tiket ini akan dihapus.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
