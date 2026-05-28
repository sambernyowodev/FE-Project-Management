import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { useGetRoles, useDeleteRole } from '@/modules/master/roles/hooks/useRoles';
import DataTable, { type ColumnDef } from '@/shared/components/DataTable';
import type { Role } from '@/modules/master/roles/types';

export function RoleListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: rolesRes, isLoading, refetch } = useGetRoles();

  const deleteMutation = useDeleteRole();

  // Roles endpoint /roles does not have server-side pagination, sorting, or search.
  // We can do simple client-side search/sort/filter if needed, but since DataTable handles rendering,
  // let's pass the filtered data to DataTable.
  const rawRoles = rolesRes || [];

  const filteredRoles = rawRoles.filter(role => {
    const term = search.toLowerCase();
    return (
      role.name.toLowerCase().includes(term) ||
      role.code.toLowerCase().includes(term) ||
      (role.description || '').toLowerCase().includes(term)
    );
  });

  const handleDeactivate = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus role "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const columns: ColumnDef<Role, any>[] = [
    {
      id: 'code',
      header: 'Role Code',
      accessorKey: 'code',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-primary font-bold bg-primary-container/20 px-2 py-1 rounded">
          {row.original.code}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Role Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <span className="font-semibold text-on-background">{row.original.name}</span>
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
            onClick={() => navigate(`/master/roles/${row.original.id}`)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all cursor-pointer"
            title="Edit Role"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeactivate(row.original.id, row.original.name)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-error hover:bg-error/5 transition-all cursor-pointer"
            title="Delete Role"
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
          <h1 className="text-3xl font-bold text-on-background mb-1">Roles</h1>
          <p className="text-secondary text-sm">Configure job roles, titles, and team designations.</p>
        </div>
      </div>

      <DataTable
        data={filteredRoles}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search roles by name, code, or description..."
        onAdd={() => navigate('/master/roles/new')}
        addLabel="New Role"
        totalItems={filteredRoles.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearchChange={setSearch}
        onSortChange={() => {}}
        onFilterChange={() => {}}
        onRefresh={refetch}
        exportFilename="roles-list"
      />
    </div>
  );
}
