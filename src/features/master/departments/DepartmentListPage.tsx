import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Network } from 'lucide-react';
import { useGetDepartments, useDeleteDepartment } from '@/modules/master/departments/hooks/useDepartments';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { Department } from '@/modules/master/departments/types';

export function DepartmentListPage() {
  const navigate = useNavigate();
  const { data: departments = [], isLoading, refetch } = useGetDepartments();
  const deleteMutation = useDeleteDepartment();

  const handleDeactivate = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus department "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<Department, any>[] = [
    {
      id: 'company',
      header: 'Company',
      accessorKey: 'company.name',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.company?.name || '-'}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Department Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-on-background">
          <Network className="w-4 h-4 text-primary" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <span className="text-secondary text-sm line-clamp-1">{row.original.description || '-'}</span>
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
            onClick={() => navigate(`/master/departments/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Department"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeactivate(row.original.id, row.original.name)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Department"
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
          <h1 className="text-3xl font-bold text-on-background mb-1">Master Data Department</h1>
          <p className="text-secondary text-sm">Kelola data department/divisi di dalam masing-masing company.</p>
        </div>
      </div>

      <DataTable
        data={departments}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Cari department berdasarkan nama, company, atau deskripsi..."
        onAdd={() => navigate('/master/departments/new')}
        addLabel="Tambah Department"
        onRefresh={refetch}
        exportFilename="departments-list"
      />
    </div>
  );
}
