import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserCheck } from 'lucide-react';
import {
  useGetBusinessOwner,
  useCreateBusinessOwner,
  useUpdateBusinessOwner,
  useDeleteBusinessOwner,
} from '@/modules/master/business-owners/hooks/useBusinessOwners';
import { useGetCompanies } from '@/modules/master/companies/hooks/useCompanies';
import { useGetDepartments } from '@/modules/master/departments/hooks/useDepartments';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';

export function BusinessOwnerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: businessOwner, isLoading: isBoLoading } = useGetBusinessOwner(id || '');
  const { data: companies = [] } = useGetCompanies();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const { data: departments = [] } = useGetDepartments(selectedCompanyId || undefined);

  const createMutation = useCreateBusinessOwner();
  const updateMutation = useUpdateBusinessOwner();
  const deleteMutation = useDeleteBusinessOwner();

  const [formData, setFormData] = useState({
    departmentId: '',
    name: '',
    title: '',
    email: '',
    phone: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (businessOwner && isEditing) {
      if (businessOwner.department?.companyId) {
        setSelectedCompanyId(businessOwner.department.companyId);
      }
      setFormData({
        departmentId: businessOwner.departmentId || '',
        name: businessOwner.name || '',
        title: businessOwner.title || '',
        email: businessOwner.email || '',
        phone: businessOwner.phone || '',
      });
    }
  }, [businessOwner, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    setSelectedCompanyId(companyId);
    setFormData(prev => ({ ...prev, departmentId: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.departmentId) {
      setError('Department wajib dipilih');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nama Business Owner wajib diisi');
      return;
    }

    const payload = {
      departmentId: formData.departmentId,
      name: formData.name.trim(),
      title: formData.title.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      isActive: true,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            navigate('/master/business-owners');
          },
          onError: (err: any) => {
            setError(err?.message || 'Gagal memperbarui Business Owner');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/business-owners');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal membuat Business Owner');
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
        navigate('/master/business-owners');
      },
      onError: () => {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  if (isEditing && isBoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail Business Owner...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/master/business-owners')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Business Owner' : 'Tambah Business Owner Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? `Ubah data untuk Business Owner ${businessOwner?.name || ''}`
                : 'Tambah PIC/Business Owner baru dari pihak customer.'}
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
            <span>Hapus Business Owner</span>
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
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Informasi Business Owner</span>
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="companyId" className="text-sm font-semibold text-on-background">
                  Company *
                </label>
                <select
                  id="companyId"
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
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
                <label htmlFor="departmentId" className="text-sm font-semibold text-on-background">
                  Department *
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  required
                  disabled={!selectedCompanyId}
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background disabled:bg-surface-container-low disabled:opacity-70"
                >
                  <option value="">
                    {!selectedCompanyId ? '-- Pilih Company terlebih dahulu --' : '-- Pilih Department --'}
                  </option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-on-background">
                  Nama Business Owner *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. Budi Santoso"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="title" className="text-sm font-semibold text-on-background">
                  Jabatan / Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. VP Human Capital Systems"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-on-background">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="budi.santoso@telkomsel.co.id"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-on-background">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="081234567890"
                  />
                </div>
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
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Business Owner'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/business-owners')}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>

      {/* Confirm Dialog for Business Owner Delete */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Business Owner?"
        message={`Apakah Anda yakin ingin menghapus business owner "${businessOwner?.name || ''}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
