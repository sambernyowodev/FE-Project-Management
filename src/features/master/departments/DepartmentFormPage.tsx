import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Network } from 'lucide-react';
import {
  useGetDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/modules/master/departments/hooks/useDepartments';
import { useGetCompanies } from '@/modules/master/companies/hooks/useCompanies';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';

export function DepartmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: department, isLoading: isDeptLoading } = useGetDepartment(id || '');
  const { data: companies = [] } = useGetCompanies();

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    description: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (department && isEditing) {
      setFormData({
        companyId: department.companyId || '',
        name: department.name || '',
        description: department.description || '',
      });
    }
  }, [department, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.companyId) {
      setError('Company wajib dipilih');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nama department wajib diisi');
      return;
    }

    const payload = {
      companyId: formData.companyId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      isActive: true,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            navigate('/master/departments');
          },
          onError: (err: any) => {
            setError(err?.message || 'Gagal memperbarui department');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/departments');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal membuat department');
        },
      });
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(id!, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        navigate('/master/departments');
      },
      onError: () => {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  if (isEditing && isDeptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail department...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/master/departments')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Department' : 'Tambah Department Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? `Ubah data department ${department?.name || ''}`
                : 'Tambah unit department baru di bawah company.'}
            </p>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/5 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Department</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container text-error text-sm rounded-lg border border-error/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              <span>Informasi Department</span>
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="companyId" className="text-sm font-semibold text-on-background">
                  Company *
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  required
                  value={formData.companyId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                >
                  <option value="">-- Pilih Company --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-on-background">
                  Nama Department *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. HCM, IT, Finance"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-semibold text-on-background">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                  placeholder="Deskripsi singkat seputar fungsi divisi/department..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Department'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/departments')}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>

      {/* Confirm Dialog for Department Delete */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Department?"
        message={`Apakah Anda yakin ingin menghapus department "${department?.name || ''}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
