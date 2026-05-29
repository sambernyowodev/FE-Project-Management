import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Layers, ShieldCheck } from 'lucide-react';
import {
  useGetMasterProject,
  useCreateMasterProject,
  useUpdateMasterProject,
  useDeleteMasterProject
} from '@/modules/master/projects/hooks/useMasterProjects';
import { formatDate } from '@/shared/lib/formatter';

export function MasterProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: project, isLoading: isProjectLoading } = useGetMasterProject(Number(id));

  const createMutation = useCreateMasterProject();
  const updateMutation = useUpdateMasterProject();
  const deleteMutation = useDeleteMasterProject();

  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    description: '',
    isActive: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (project && isEditing) {
      setFormData({
        name: project.name || '',
        platform: project.platform || '',
        description: project.description || '',
        isActive: project.isActive !== undefined ? project.isActive : true,
      });
    }
  }, [project, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nama project wajib diisi');
      return;
    }

    const payload = {
      name: formData.name,
      platform: formData.platform || undefined,
      description: formData.description || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: Number(id), data: payload },
        {
          onSuccess: () => {
            navigate('/master/projects');
          },
          onError: (err: any) => {
            setError(err?.message || 'Gagal memperbarui master project');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate('/master/projects');
        },
        onError: (err: any) => {
          setError(err?.message || 'Gagal membuat master project');
        },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus master project ini?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          navigate('/master/projects');
        },
      });
    }
  };

  if (isEditing && isProjectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat detail project...</span>
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
            onClick={() => navigate('/master/projects')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">
              {isEditing ? 'Edit Master Project' : 'Tambah Master Project Baru'}
            </h1>
            <p className="text-secondary text-sm">
              {isEditing
                ? `Ubah konfigurasi catalog untuk ${project?.name || ''}`
                : 'Daftarkan project master baru ke dalam catalog enterprise.'}
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
            <span>Hapus Project</span>
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
              <Layers className="w-5 h-5 text-primary" />
              <span>Informasi Project</span>
            </h2>

            <div className="flex flex-col gap-5">
              {/* Project Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-on-background">
                  Nama Project *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. Core Banking System"
                />
              </div>

              {/* Platform */}
              <div className="flex flex-col gap-2">
                <label htmlFor="platform" className="text-sm font-semibold text-on-background">
                  Platform
                </label>
                <input
                  id="platform"
                  name="platform"
                  type="text"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  placeholder="e.g. Web, Android, iOS, API Gateway"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-semibold text-on-background">
                  Deskripsi Project
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background resize-y"
                  placeholder="Penjelasan detail mengenai scope dan fungsionalitas project..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Status & Metadata Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Status & Info</span>
            </h2>

            <div className="flex flex-col gap-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="isActive" className="text-sm font-semibold text-on-background">
                      Status Project
                    </label>
                    <select
                      id="isActive"
                      name="isActive"
                      disabled
                      value={String(formData.isActive)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-surface-container-low opacity-60 cursor-not-allowed font-semibold focus:outline-none"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                    <p className="font-semibold text-on-background mb-1">ℹ️ Metadata:</p>
                    <p>Project Code: <span className="font-mono font-semibold">{project?.projectCode}</span></p>
                    <p className="mt-1">Project ID: <span className="font-mono font-semibold">{project?.id}</span></p>
                    {project?.createdAt && (
                      <p className="mt-1">
                        Terdaftar: {formatDate(project.createdAt, 'short')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-secondary leading-relaxed bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
                  <p className="font-semibold text-on-background mb-1">💡 Catatan:</p>
                  Project baru akan otomatis berstatus <strong>Active</strong> dan sistem akan secara otomatis membuat <strong>Project Code</strong> unik berformat <span className="font-mono">HCM-YYYY-XXX</span>.
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
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Project'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/master/projects')}
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
