import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Building2 } from 'lucide-react';
import {
  useGetCompany,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from '@/modules/master/companies/hooks/useCompanies';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';

export function CompanyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: company, isLoading: isCompanyLoading } = useGetCompany(id || '');

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (company && isEditing) {
      setFormData({
        code: company.code || '',
        name: company.name || '',
        address: company.address || '',
      });
    }
  }, [company, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code.trim()) {
      setError('Kode company wajib diisi');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nama company wajib diisi');
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      isActive: true,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            navigate('/master/companies');
          },
          onError: (err: any) => {
            setError(err?.message || 'Gagal memperbarui company');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/companies');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal membuat company');
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
        navigate('/master/companies');
      },
      onError: () => {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  if (isEditing && isCompanyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail company...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/master/companies')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Company' : 'Tambah Company Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? `Ubah data untuk company ${company?.name || ''}`
                : 'Definisikan entitas perusahaan customer baru.'}
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
            <span>Hapus Company</span>
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
              <Building2 className="w-5 h-5 text-primary" />
              <span>Informasi Company</span>
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-sm font-semibold text-on-background">
                  Kode Company *
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-mono uppercase"
                  placeholder="e.g. TELKOMSEL, MANDIRI"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-on-background">
                  Nama Company *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. PT Telekomunikasi Selular"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-sm font-semibold text-on-background">
                  Alamat / Keterangan
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                  placeholder="Alamat kantor atau lokasi utama..."
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
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Company'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/companies')}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>

      {/* Confirm Dialog for Company Delete */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Company?"
        message={`Apakah Anda yakin ingin menghapus company "${company?.name || ''}" (${company?.code || ''})?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
