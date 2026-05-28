import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Coins, ShieldCheck } from 'lucide-react';
import {
  useGetRoleRate,
  useCreateRoleRate,
  useUpdateRoleRate
} from '@/modules/master/role-rates/hooks/useRoleRates';
import { useGetRoles } from '@/modules/master/roles/hooks/useRoles';
import { useGetProjects } from '@/modules/projects/hooks/useProjects';

export function RoleRateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: roleRate, isLoading: isRoleRateLoading } = useGetRoleRate(Number(id));
  const { data: roles = [], isLoading: isRolesLoading } = useGetRoles();
  const { data: projectsRes, isLoading: isProjectsLoading } = useGetProjects({ perPage: 100 });

  const createMutation = useCreateRoleRate();
  const updateMutation = useUpdateRoleRate();

  const [scope, setScope] = useState<'global' | 'project'>('global');
  const [formData, setFormData] = useState({
    roleId: '',
    projectId: '',
    ratePerManday: '',
    ratePerHour: '',
    currency: 'IDR',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: '',
    isActive: true,
  });

  const [error, setError] = useState('');

  const projects = projectsRes?.data || [];

  useEffect(() => {
    if (roleRate && isEditing) {
      setScope(roleRate.projectId ? 'project' : 'global');
      setFormData({
        roleId: String(roleRate.roleId || ''),
        projectId: roleRate.projectId ? String(roleRate.projectId) : '',
        ratePerManday: String(roleRate.ratePerManday || ''),
        ratePerHour: roleRate.ratePerHour ? String(roleRate.ratePerHour) : '',
        currency: roleRate.currency || 'IDR',
        effectiveFrom: roleRate.effectiveFrom ? roleRate.effectiveFrom.split('T')[0] : '',
        effectiveUntil: roleRate.effectiveUntil ? roleRate.effectiveUntil.split('T')[0] : '',
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

    if (scope === 'project' && !formData.projectId) {
      setError('Project wajib dipilih jika cakupan adalah Project-Specific');
      return;
    }

    if (!formData.ratePerManday || Number(formData.ratePerManday) <= 0) {
      setError('Rate per manday wajib diisi dan harus lebih besar dari 0');
      return;
    }

    if (!formData.effectiveFrom) {
      setError('Tanggal berlaku efektif (Effective From) wajib diisi');
      return;
    }

    const payload: any = {
      roleId: Number(formData.roleId),
      projectId: scope === 'project' ? Number(formData.projectId) : null,
      ratePerManday: Number(formData.ratePerManday),
      ratePerHour: formData.ratePerHour ? Number(formData.ratePerHour) : undefined,
      currency: formData.currency,
      effectiveFrom: formData.effectiveFrom,
      effectiveUntil: formData.effectiveUntil || undefined,
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

  if (isEditing && (isRoleRateLoading || isRolesLoading || isProjectsLoading)) {
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

              {/* Scope Scope Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-background">Cakupan Rate (Scope) *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-on-background font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'global'}
                      onChange={() => setScope('global')}
                      className="accent-primary w-4 h-4"
                    />
                    <span>Global (Berlaku untuk semua project)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-background font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'project'}
                      onChange={() => setScope('project')}
                      className="accent-primary w-4 h-4"
                    />
                    <span>Project-Specific</span>
                  </label>
                </div>
              </div>

              {/* Project Selection (Conditional) */}
              {scope === 'project' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="projectId" className="text-sm font-semibold text-on-background">
                    Project *
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    required
                    value={formData.projectId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  >
                    <option value="">-- Pilih Project --</option>
                    {projects.map((proj: any) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} ({proj.customer})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rate Per Manday */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="ratePerManday" className="text-sm font-semibold text-on-background">
                    Rate per Manday *
                  </label>
                  <div className="relative">
                    <input
                      id="ratePerManday"
                      name="ratePerManday"
                      type="number"
                      min="1"
                      required
                      value={formData.ratePerManday}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. 1500000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary font-bold font-mono">
                      {formData.currency}
                    </span>
                  </div>
                </div>

                {/* Rate Per Hour */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="ratePerHour" className="text-sm font-semibold text-on-background">
                    Rate per Hour (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      id="ratePerHour"
                      name="ratePerHour"
                      type="number"
                      min="1"
                      value={formData.ratePerHour}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                      placeholder="e.g. 187500"
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

              {/* Date ranges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="effectiveFrom" className="text-sm font-semibold text-on-background">
                    Effective From *
                  </label>
                  <input
                    id="effectiveFrom"
                    name="effectiveFrom"
                    type="date"
                    required
                    value={formData.effectiveFrom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="effectiveUntil" className="text-sm font-semibold text-on-background">
                    Effective Until (Opsional)
                  </label>
                  <input
                    id="effectiveUntil"
                    name="effectiveUntil"
                    type="date"
                    value={formData.effectiveUntil}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background font-semibold"
                  />
                </div>
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
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
