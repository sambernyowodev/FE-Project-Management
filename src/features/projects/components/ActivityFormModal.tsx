import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { 
  useCreateProjectActivity, 
  useUpdateProjectActivity 
} from '@/modules/projects/hooks/useProjectActivities';
import type { ProjectActivity } from '@/modules/projects/types';

const PHASE_OPTIONS = [
  'FCAB', 'REQUIREMENT', 'ANALYSIS', 'DESIGN', 'SRS', 'CRQ', 'DEVELOPMENT',
  'UT SIT', 'TRA TC', 'REVIEW', 'SIT', 'UAT', 'NFT', 'SECURITY', 'RFS', 'FUT'
];

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  activity?: ProjectActivity | null; // If provided, edit mode
  parentId?: number | null; // If provided, create sub-activity
  members: any[];
  activities: ProjectActivity[];
}

export function ActivityFormModal({ 
  isOpen, 
  onClose, 
  projectId, 
  activity, 
  parentId, 
  members,
  activities
}: ActivityFormModalProps) {
  const isEditing = Boolean(activity);
  const createMutation = useCreateProjectActivity(projectId);
  const updateMutation = useUpdateProjectActivity(projectId);

  const [formData, setFormData] = useState({
    activityName: '',
    description: '',
    feature: '',
    subFeature: '',
    details: '',
    durationDays: '',
    mandays: '',
    startDate: '',
    endDate: '',
    progressPct: '0',
    phase: 'DEVELOPMENT',
    assignedToId: '',
    parentId: '',
    isMilestone: false,
    sortOrder: '0'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (activity) {
        setFormData({
          activityName: activity.activityName || '',
          description: activity.description || '',
          feature: activity.feature || '',
          subFeature: activity.subFeature || '',
          details: activity.details || '',
          durationDays: activity.durationDays !== undefined ? String(activity.durationDays) : '',
          mandays: activity.mandays !== undefined ? String(activity.mandays) : '',
          startDate: activity.startDate ? activity.startDate.split('T')[0] : '',
          endDate: activity.endDate ? activity.endDate.split('T')[0] : '',
          progressPct: String(activity.progressPct || 0),
          phase: activity.phase || 'DEVELOPMENT',
          assignedToId: activity.assignedToId ? String(activity.assignedToId) : '',
          parentId: activity.parentId ? String(activity.parentId) : '',
          isMilestone: activity.isMilestone || false,
          sortOrder: String(activity.sortOrder || 0)
        });
      } else {
        setFormData({
          activityName: '',
          description: '',
          feature: '',
          subFeature: '',
          details: '',
          durationDays: '',
          mandays: '',
          startDate: '',
          endDate: '',
          progressPct: '0',
          phase: 'DEVELOPMENT',
          assignedToId: '',
          parentId: parentId ? String(parentId) : '',
          isMilestone: false,
          sortOrder: String(activities.length)
        });
      }
    }
  }, [isOpen, activity, parentId, activities]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('Tanggal mulai tidak boleh setelah tanggal selesai');
        return;
      }
    }

    const payload: any = {
      projectId,
      activityName: formData.activityName,
      description: formData.description || undefined,
      feature: formData.feature || undefined,
      subFeature: formData.subFeature || undefined,
      details: formData.details || undefined,
      durationDays: formData.durationDays ? Number(formData.durationDays) : undefined,
      mandays: formData.mandays ? Number(formData.mandays) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      progressPct: Number(formData.progressPct),
      phase: formData.phase,
      assignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      parentId: formData.parentId ? Number(formData.parentId) : null,
      isMilestone: formData.isMilestone,
      sortOrder: Number(formData.sortOrder)
    };

    if (isEditing && activity) {
      updateMutation.mutate(
        { id: activity.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setError(err.message || 'Gagal memperbarui aktivitas');
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setError(err.message || 'Gagal membuat aktivitas');
        }
      });
    }
  };

  // Filter parents to avoid circular dependency
  const availableParents = activities.filter(act => {
    if (isEditing && activity) {
      return act.id !== activity.id && !act.parentId; // Can't be parent of itself, and nesting is max 2 levels
    }
    return !act.parentId; // Only top level tasks can be parents
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div>
            <h3 className="text-lg font-bold text-on-background">
              {isEditing ? 'Ubah Aktivitas' : formData.parentId ? 'Tambah Sub-Aktivitas' : 'Tambah Aktivitas'}
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              {isEditing ? 'Perbarui data aktivitas project.' : 'Masukkan rincian untuk aktivitas baru.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto p-6 gap-5">
          {error && (
            <div className="p-3 bg-error-container text-error text-sm rounded-lg border border-error/20 font-medium">
              {error}
            </div>
          )}

          {/* Activity Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-background">Nama Aktivitas *</label>
            <input
              type="text"
              name="activityName"
              required
              value={formData.activityName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g. Analisis Kebutuhan Sistem"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Activity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Aktivitas Utama (Parent)</label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- Tanpa Parent (Top Level) --</option>
                {availableParents.map(act => (
                  <option key={act.id} value={act.id}>{act.activityName}</option>
                ))}
              </select>
            </div>

            {/* Phase */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Phase / Tahapan</label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              >
                {PHASE_OPTIONS.map(ph => (
                  <option key={ph} value={ph}>{ph}</option>
                ))}
              </select>
            </div>

            {/* Feature */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Modul / Feature</label>
              <input
                type="text"
                name="feature"
                value={formData.feature}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g. Authentication"
              />
            </div>

            {/* Sub Feature */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Sub-Feature</label>
              <input
                type="text"
                name="subFeature"
                value={formData.subFeature}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g. OAuth Google"
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-background">Details / Deskripsi Singkat</label>
            <input
              type="text"
              name="details"
              value={formData.details}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g. Integrasi login menggunakan credential Google"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Tanggal Mulai</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Tanggal Selesai</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Duration Days */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Durasi (Hari Kalender)</label>
              <input
                type="number"
                name="durationDays"
                min="0"
                value={formData.durationDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g. 5"
              />
            </div>

            {/* Mandays */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Mandays (Hari Kerja Efektif)</label>
              <input
                type="number"
                name="mandays"
                min="0"
                step="0.1"
                value={formData.mandays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g. 3.5"
              />
            </div>

            {/* Assigned Resource */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Resource yang Ditugaskan</label>
              <select
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- Belum Ditugaskan --</option>
                {Array.from(new Map(members.map(m => [m.userId, m])).values()).map(member => {
                  const roleName = member.role?.name || 'Resource';
                  const userName = member.user?.fullName || member.user?.name || `User ID: ${member.userId}`;
                  return (
                    <option key={member.userId} value={member.userId}>
                      {userName} ({roleName})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Progress Percentage */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-background">Progress</label>
                <span className="text-xs font-bold text-primary">{formData.progressPct}%</span>
              </div>
              <input
                type="range"
                name="progressPct"
                min="0"
                max="100"
                value={formData.progressPct}
                onChange={handleChange}
                className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer mt-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant pt-4">
            {/* Milestone Checkbox */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isMilestone"
                name="isMilestone"
                checked={formData.isMilestone}
                onChange={handleChange}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
              />
              <label htmlFor="isMilestone" className="text-sm font-semibold text-on-background cursor-pointer select-none">
                Jadikan Milestone Project
              </label>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Urutan Tampilan (Sort Order)</label>
              <input
                type="number"
                name="sortOrder"
                min="0"
                value={formData.sortOrder}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 pb-2">
            <label className="text-sm font-semibold text-on-background">Deskripsi / Detail Tambahan</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="Catatan tambahan mengenai aktivitas ini..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Aktivitas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
