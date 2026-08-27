import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, UserCheck, Mail, Phone } from 'lucide-react';
import { useGetBusinessOwners, useDeleteBusinessOwner } from '@/modules/master/business-owners/hooks/useBusinessOwners';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import type { BusinessOwner } from '@/modules/master/business-owners/types';

export function BusinessOwnerListPage() {
  const navigate = useNavigate();
  const { data: businessOwners = [], isLoading, refetch } = useGetBusinessOwners();
  const deleteMutation = useDeleteBusinessOwner();
  const [deletingOwner, setDeletingOwner] = useState<{ id: string; name: string } | null>(null);

  const handleConfirmDelete = () => {
    if (!deletingOwner) return;
    deleteMutation.mutate(deletingOwner.id, {
      onSuccess: () => {
        setDeletingOwner(null);
        refetch();
      },
      onError: () => {
        setDeletingOwner(null);
      }
    });
  };

  const columns: ColumnDef<BusinessOwner, any>[] = [
    {
      id: 'company',
      header: 'Company',
      accessorKey: 'department.company.name',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.department?.company?.name || '-'}
        </span>
      ),
    },
    {
      id: 'department',
      header: 'Department',
      accessorKey: 'department.name',
      cell: ({ row }) => (
        <span className="text-on-background font-medium">
          {row.original.department?.name || '-'}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Nama Business Owner',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-semibold text-on-background">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>{row.original.name}</span>
          </div>
          {row.original.title && (
            <span className="text-xs text-secondary pl-6">{row.original.title}</span>
          )}
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Kontak',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs text-secondary gap-0.5">
          {row.original.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-secondary/70" />
              <span>{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-secondary/70" />
              <span>{row.original.phone}</span>
            </div>
          )}
          {!row.original.email && !row.original.phone && <span>-</span>}
        </div>
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
            onClick={() => navigate(`/master/business-owners/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Business Owner"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingOwner({ id: row.original.id, name: row.original.name })}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Business Owner"
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
          <h1 className="text-3xl font-bold text-on-background mb-1">Master Data Business Owner</h1>
          <p className="text-secondary text-sm">Kelola data PIC / Business Owner dari pihak customer per department.</p>
        </div>
      </div>

      <DataTable
        data={businessOwners}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Cari business owner berdasarkan nama, title, department, atau company..."
        onAdd={() => navigate('/master/business-owners/new')}
        addLabel="Tambah Business Owner"
        onRefresh={refetch}
        exportFilename="business-owners-list"
      />

      {/* Confirm Dialog for Delete Business Owner */}
      <ConfirmDialog
        isOpen={Boolean(deletingOwner)}
        onClose={() => setDeletingOwner(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Business Owner?"
        message={`Apakah Anda yakin ingin menghapus business owner "${deletingOwner?.name || ''}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
