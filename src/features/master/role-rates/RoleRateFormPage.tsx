import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Coins, ShieldCheck, Trash2 } from 'lucide-react';
import {
  useGetRoleRate,
  useCreateRoleRate,
  useUpdateRoleRate,
  useDeleteRoleRate
} from '@/modules/master/role-rates/hooks/useRoleRates';
import { useGetRoles } from '@/modules/master/roles/hooks/useRoles';

export function RoleRateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: roleRate, isLoading: isRoleRateLoading } = useGetRoleRate(Number(id));
  const { data: roles = [], isLoading: isRolesLoading } = useGetRoles();

  const createMutation = useCreateRoleRate();
  const updateMutation = useUpdateRoleRate();
  const deleteMutation = useDeleteRoleRate();

  const [formData, setFormData] = useState({
    roleId: '',
    ratePerMandayProject: '',
    ratePerMandaySupport: '',
    currency: 'IDR',
    isActive: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (roleRate && isEditing) {
      setFormData({
        roleId: String(roleRate.roleId || ''),
        ratePerMandayProject: String(roleRate.ratePerMandayProject || ''),
        ratePerMandaySupport: String(roleRate.ratePerMandaySupport || ''),
        currency: roleRate.currency || 'IDR',
        isActive: roleRate.isActive !== undefined ? roleRate.isActive : true,
      });
    }
  }, [roleRate, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.roleId) {
      setError('Role wajib dipilih');
      return;
    }

    if (!formData.ratePerMandayProject || Number(formData.ratePerMandayProject) <= 0) {
      setError('Rate per Manday Project wajib diisi dan harus lebih besar dari 0');
      return;
    }

    if (!formData.ratePerMandaySupport || Number(formData.ratePerMandaySupport) <= 0) {
      setError('Rate per Manday Support wajib diisi dan harus lebih besar dari 0');
      return;
    }

    const payload = {
      roleId: Number(formData.roleId),
      ratePerMandayProject: Number(formData.ratePerMandayProject),
      ratePerMandaySupport: Number(formData.ratePerMandaySupport),
      currency: formData.currency,
      isActive: formData.isActive,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: () => {
            navigate('/master/role-rates');
          },
          onError: (err: any) => {
            setError(err?.message || 'Gagal memperbarui rate');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/role-rates');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal membuat rate baru');
        },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rate ini?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          navigate('/master/role-rates');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal menghapus rate');
        },
      });
    }
  };

  if (isEditing && (isRoleRateLoading || isRolesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail rate...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/master/role-rates')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Role Rate' : 'Tambah Role Rate Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? 'Ubah konfigurasi rate penugasan dan periode berlakunya.'
                : 'Definisikan harga satuan (rate) penugasan role per manday.'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error-container text-error text-sm rounded-lg border border-error/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span>Detail Rate</span>
            </h2>

            <div className="flex flex-col gap-5">
              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label htmlFor="roleId" className="text-sm font-semibold text-on-background">
                  Role *
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  required
                  value={formData.roleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                >
                  <option value="">-- Pilih Role --</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate Per Manday Project & Support */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="ratePerMandayProject" className="text-sm font-semibold text-on-background">
                    Rate per Manday (Project) *
                  </label>
                  <div className="relative">
                    <input
                      id="ratePerMandayProject"
                      name="ratePerMandayProject"
                      type="number"
                      min="1"
                      required
                      value={formData.ratePerMandayProject}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. 1500000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary font-bold font-mono">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="ratePerMandaySupport" className="text-sm font-semibold text-on-background">
                    Rate per Manday (Support) *
                  </label>
                  <div className="relative">
                    <input
                      id="ratePerMandaySupport"
                      name="ratePerMandaySupport"
                      type="number"
                      min="1"
                      required
                      value={formData.ratePerMandaySupport}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. 1200000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary font-bold font-mono">
                      {formData.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="flex flex-col gap-2">
                <label htmlFor="currency" className="text-sm font-semibold text-on-background">
                  Mata Uang (Currency)
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                >
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Status Check Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Status Rate</span>
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="isActive" className="text-sm font-semibold text-on-background">
                  Status Rate
                </label>
                <select
                  id="isActive"
                  name="isActive"
                  value={String(formData.isActive)}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))
                  }
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background font-semibold focus:outline-none"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                <p className="font-semibold text-on-background mb-1">ℹ️ Info:</p>
                Rate penugasan akan digunakan oleh sistem billing saat membuat invoice berdasarkan manday actual pengerjaan oleh member dengan role terkait.
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Rate'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/role-rates')}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer mb-2"
            >
              Batal
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-error/10 hover:bg-error/20 text-error rounded-lg transition-colors text-sm font-bold cursor-pointer disabled:opacity-50 border border-error/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Rate (Soft Delete)</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
