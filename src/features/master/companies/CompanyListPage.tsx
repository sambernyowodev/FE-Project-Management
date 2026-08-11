import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Building2 } from 'lucide-react';
import { useGetCompanies, useDeleteCompany } from '@/modules/master/companies/hooks/useCompanies';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { Company } from '@/modules/master/companies/types';

export function CompanyListPage() {
  const navigate = useNavigate();
  const { data: companies = [], isLoading, refetch } = useGetCompanies();
  const deleteMutation = useDeleteCompany();

  const handleDeactivate = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus company "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<Company, any>[] = [
    {
      id: 'code',
      header: 'Company Code',
      accessorKey: 'code',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-primary font-bold bg-primary-container/20 px-2 py-1 rounded">
          {row.original.code}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Company Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-on-background">
          <Building2 className="w-4 h-4 text-primary" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      accessorKey: 'address',
      cell: ({ row }) => (
        <span className="text-secondary text-sm line-clamp-1">{row.original.address || '-'}</span>
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
            onClick={() => navigate(`/master/companies/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Company"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeactivate(row.original.id, row.original.name)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Company"
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
          <h1 className="text-3xl font-bold text-on-background mb-1">Master Data Company</h1>
          <p className="text-secondary text-sm">Kelola data perusahaan customer/klien.</p>
        </div>
      </div>

      <DataTable
        data={companies}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Cari company berdasarkan kode, nama, atau alamat..."
        onAdd={() => navigate('/master/companies/new')}
        addLabel="Tambah Company"
        onRefresh={refetch}
        exportFilename="companies-list"
      />
    </div>
  );
}
