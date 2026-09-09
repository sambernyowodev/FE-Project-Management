import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, CheckSquare, AlertCircle } from 'lucide-react';
import {
  useCreateProjectActivity,
  useUpdateProjectActivity
} from '@/modules/projects/hooks/useProjectActivities';
import { useGetResourceWorkloadMap } from '@/modules/resources/hooks/useResources';
import { useGetHolidays } from '@/modules/master/holidays/hooks/useHolidays';
import { formatDateInput } from '@/shared/lib/formatter';
import {
  calculateWorkingMandays,
  calculateCalendarDays,
  isNationalHoliday,
  createHolidayMap
} from '@/shared/lib/project-calculations';
import type { ProjectActivity } from '@/modules/projects/types';

const PHASE_OPTIONS = [
  'FCAB', 'REQUIREMENT', 'ANALYSIS', 'DESIGN', 'SRS', 'CRQ', 'DEVELOPMENT',
  'UT SIT', 'TRA TC', 'REVIEW', 'SIT', 'UAT', 'NFT', 'SECURITY', 'RFS', 'FUT'
];

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  activity?: ProjectActivity | null; // If provided, edit mode
  parentId?: string | null; // If provided, create sub-activity
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
  const { data: workloadMap = {} } = useGetResourceWorkloadMap();
  const { data: holidays = [] } = useGetHolidays();
  const holidayMap = useMemo(() => createHolidayMap(holidays), [holidays]);

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
          startDate: activity.startDate ? formatDateInput(activity.startDate) : '',
          endDate: activity.endDate ? formatDateInput(activity.endDate) : '',
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

  const startHoliday = useMemo(() => isNationalHoliday(formData.startDate, holidayMap), [formData.startDate, holidayMap]);
  const endHoliday = useMemo(() => isNationalHoliday(formData.endDate, holidayMap), [formData.endDate, holidayMap]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      
      // If start date or end date changed, auto-calculate duration and working mandays
      if ((name === 'startDate' || name === 'endDate') && typeof val === 'string') {
        const sDate = name === 'startDate' ? val : prev.startDate;
        const eDate = name === 'endDate' ? val : prev.endDate;

        if (sDate && eDate) {
          const calDays = calculateCalendarDays(sDate, eDate);
          const workDays = calculateWorkingMandays(sDate, eDate, holidayMap);
          if (calDays >= 0) {
            next.durationDays = String(calDays);
            next.mandays = String(workDays);
          }
        }
      }

      return next;
    });
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
      durationDays: formData.durationDays ? Math.round(Number(formData.durationDays)) : undefined,
      mandays: formData.mandays ? Math.round(Number(formData.mandays)) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      progressPct: Math.round(Number(formData.progressPct)),
      phase: formData.phase,
      assignedToId: formData.assignedToId || null,
      parentId: formData.parentId || null,
      isMilestone: formData.isMilestone,
      sortOrder: Math.round(Number(formData.sortOrder))
    };

    if (isEditing && activity) {
      updateMutation.mutate(
        { id: activity.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err: any) => {
            setError(err.message || 'Gagal memperbarui aktivitas');
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Gagal membuat aktivitas');
        }
      });
    }
  };

  // Filter parents to avoid circular dependency
  const parentOptions = activities.filter(act => {
    if (isEditing && activity) {
      return act.id !== activity.id && !act.parentId;
    }
    return !act.parentId;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-background">
                {isEditing ? 'Edit Aktivitas / Task' : (parentId ? 'Tambah Sub-Aktivitas' : 'Tambah Aktivitas Baru')}
              </h2>
              <p className="text-xs text-secondary">
                {isEditing ? 'Perbarui detail rencana pengerjaan aktivitas ini.' : 'Daftarkan aktivitas pekerjaan ke dalam timeline.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-container-high rounded-lg text-secondary hover:text-on-background transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-background">Nama Aktivitas / Task *</label>
            <input
              type="text"
              required
              name="activityName"
              value={formData.activityName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="e.g. Desain Database & ERD"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Task Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Parent Task (Opsional)</label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              >
                <option value="">-- Main Activity (Root Level) --</option>
                {parentOptions.map(act => (
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
              <label className="text-sm font-semibold text-on-background flex items-center justify-between">
                <span>Tanggal Mulai</span>
                {startHoliday && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                    Libur: {startHoliday.name}
                  </span>
                )}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 transition-all ${
                  startHoliday
                    ? 'border-red-500/60 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-outline-variant focus:ring-primary/20 focus:border-primary'
                }`}
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background flex items-center justify-between">
                <span>Tanggal Selesai</span>
                {endHoliday && (
                  <span className="text-[11px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                    Libur: {endHoliday.name}
                  </span>
                )}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 transition-all ${
                  endHoliday
                    ? 'border-red-500/60 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-outline-variant focus:ring-primary/20 focus:border-primary'
                }`}
              />
            </div>

            {/* Duration Days */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-background">Durasi (Hari Kalender)</label>
              <input
                type="number"
                name="durationDays"
                min="0"
                step="1"
                value={formData.durationDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g. 5"
              />
            </div>

            {/* Mandays */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-on-background">Mandays (Hari Kerja)</label>
                <span className="text-[10px] text-secondary font-medium">(Exclude Weekend & Libur)</span>
              </div>
              <input
                type="number"
                name="mandays"
                min="0"
                step="1"
                value={formData.mandays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-primary"
                placeholder="e.g. 3"
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
                {Array.from(new Map(members.map(m => [m.memberId, m])).values())
                  .filter(member => member.user?.isActive !== false)
                  .map(member => {
                    const roleName = member.role?.name || 'Resource';
                    const userName = member.user?.fullName || member.user?.name || `Member ID: ${member.memberId}`;
                    const workload = workloadMap[member.memberId];
                    const workloadLabel = workload?.workloadLabel || 'Idle';
                    return (
                      <option key={member.memberId} value={member.memberId}>
                        {userName} ({roleName}) — [{workloadLabel}]
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
