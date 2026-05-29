import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserCircle, ShieldCheck } from 'lucide-react';
import {
  useGetUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/modules/master/users/hooks/useUsers';
import { formatDate } from '@/shared/lib/formatter';

export function MemberFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: user, isLoading: isUserLoading } = useGetUser(Number(id));

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    isActive: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        password: '',
        employeeId: user.employeeId || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    if (!isEditing && !formData.email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    if (!isEditing && !formData.password.trim()) {
      setError('Password wajib diisi');
      return;
    }

    if (!isEditing && formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (isEditing) {
      const payload: any = {
        fullName: formData.fullName,
        employeeId: formData.employeeId || undefined,
        isActive: formData.isActive,
      };

      updateMutation.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: () => {
            navigate('/master/members');
          },
          onError: (err: any) => {
            setError(err?.response?.data?.message || err.message || 'Gagal memperbarui member');
          },
        }
      );
    } else {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        employeeId: formData.employeeId || undefined,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/members');
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || err.message || 'Gagal membuat member');
        },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menonaktifkan member ini?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          navigate('/master/members');
        },
      });
    }
  };

  if (isEditing && isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail member...</span>
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
            onClick={() => navigate('/master/members')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Member' : 'Tambah Member Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? `Ubah detail untuk ${user?.fullName || ''}`
                : 'Daftarkan anggota tim baru ke dalam sistem.'}
            </p>
          </div>
        </div>
        {isEditing && user?.isActive && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/5 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Nonaktifkan</span>
          </button>
        )}
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
              <UserCircle className="w-5 h-5 text-primary" />
              <span>Informasi Member</span>
            </h2>

            <div className="flex flex-col gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-sm font-semibold text-on-background">
                  Nama Lengkap *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. John Doe"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-on-background">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required={!isEditing}
                  disabled={isEditing}
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background ${isEditing ? 'opacity-60 cursor-not-allowed bg-surface-container-low' : ''
                    }`}
                  placeholder="e.g. john.doe@company.com"
                />
                {isEditing && (
                  <p className="text-xs text-secondary">Email tidak dapat diubah setelah dibuat.</p>
                )}
              </div>

              {/* Password - Only for create */}
              {!isEditing && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-on-background">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}

              {/* Employee ID */}
              <div className="flex flex-col gap-2">
                <label htmlFor="employeeId" className="text-sm font-semibold text-on-background">
                  Employee ID
                </label>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. EMP-001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Status & Actions */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Status & Konfigurasi</span>
            </h2>

            <div className="flex flex-col gap-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="isActive" className="text-sm font-semibold text-on-background">
                      Status Member
                    </label>
                    <select
                      id="isActive"
                      name="isActive"
                      value={String(formData.isActive)}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          isActive: e.target.value === 'true',
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-background font-semibold focus:outline-none"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  {/* Info box */}
                  <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                    <p className="font-semibold text-on-background mb-1">ℹ️ Info Member:</p>
                    <p>Member ID: <span className="font-mono font-semibold">{user?.id}</span></p>
                    {user?.createdAt && (
                      <p className="mt-1">
                        Dibuat: {formatDate(user.createdAt, 'short')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                  <p className="font-semibold text-on-background mb-1">💡 Catatan:</p>
                  Member baru akan otomatis berstatus <strong>Active</strong>. Anda dapat
                  mengubah status dan konfigurasi lainnya setelah member berhasil ditambahkan.
                </div>
              )}
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
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Member'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/members')}
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
