import { useState } from 'react';
import { Plus, Edit, Trash2, CornerDownRight, Check, X, Calendar, User, Milestone } from 'lucide-react';
import { useDeleteProjectActivity, useUpdateActivityProgress } from '@/modules/projects/hooks/useProjectActivities';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import type { ProjectActivity, ProjectMember } from '@/modules/projects/types';
import { format } from 'date-fns';

interface TaskTableProps {
  projectId: number;
  activities: ProjectActivity[];
  members: ProjectMember[];
  onEditActivity: (activity: ProjectActivity) => void;
  onAddSubActivity: (parentId: number) => void;
}

export function TaskTable({ 
  projectId, 
  activities = [], 
  members = [], 
  onEditActivity, 
  onAddSubActivity 
}: TaskTableProps) {
  const deleteMutation = useDeleteProjectActivity(projectId);
  const progressMutation = useUpdateActivityProgress(projectId);

  // Keep track of which activity progress is being edited inline
  const [editingProgressId, setEditingProgressId] = useState<number | null>(null);
  const [tempProgress, setTempProgress] = useState<string>('0');

  // Flatten and sort activities so children appear directly under their parents
  const rootActivities = activities
    .filter(a => !a.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
    
  const sortedActivities: ProjectActivity[] = [];
  rootActivities.forEach(parent => {
    sortedActivities.push(parent);
    const children = activities
      .filter(a => a.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    sortedActivities.push(...children);
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aktivitas "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const startInlineEdit = (activity: ProjectActivity) => {
    setEditingProgressId(activity.id);
    setTempProgress(String(activity.progressPct || 0));
  };

  const saveInlineProgress = (id: number) => {
    const val = Math.min(100, Math.max(0, Number(tempProgress) || 0));
    progressMutation.mutate(
      { id, progressPct: val },
      {
        onSuccess: () => {
          setEditingProgressId(null);
        }
      }
    );
  };

  const getMemberName = (userId?: number) => {
    if (!userId) return '-';
    const member = members.find(m => m.userId === userId);
    return member?.user?.fullName || `ID: ${userId}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h3 className="font-bold text-on-background">Daftar Aktivitas & Tahapan</h3>
        <span className="text-xs text-secondary font-medium">{activities.length} Aktivitas Terinput</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low/50">
              <th className="px-6 py-3 text-xs font-bold text-secondary uppercase tracking-wider w-[30%]">Aktivitas / Task</th>
              <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Phase</th>
              <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider w-[8%] text-center">Mandays</th>
              <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider w-[22%]">Jadwal Rencana</th>
              <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Resource</th>
              <th className="px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider w-[15%]">Progress</th>
              <th className="px-6 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-right w-[12%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {sortedActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-secondary">
                  Belum ada aktivitas. Klik "Tambah Aktivitas" untuk mulai merencanakan project timeline.
                </td>
              </tr>
            ) : (
              sortedActivities.map((act) => {
                const isChild = Boolean(act.parentId);
                const isMilestone = act.isMilestone;
                
                return (
                  <tr 
                    key={act.id} 
                    className={`hover:bg-surface-container-low/20 transition-all ${
                      isChild ? 'bg-surface-container-lowest/30' : 'bg-surface-container-lowest font-semibold'
                    }`}
                  >
                    {/* Activity Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isChild && (
                          <CornerDownRight className="w-4 h-4 text-secondary shrink-0 ml-2" />
                        )}
                        {isMilestone ? (
                          <div className="p-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md shrink-0">
                            <Milestone className="w-3.5 h-3.5" />
                          </div>
                        ) : null}
                        <div className="flex flex-col">
                          <span className={`text-sm ${isChild ? 'text-on-background' : 'text-on-background font-bold'}`}>
                            {act.activityName}
                          </span>
                          {act.feature && (
                            <span className="text-[10px] text-secondary font-medium mt-0.5">
                              Modul: {act.feature} {act.subFeature ? `› ${act.subFeature}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phase Column */}
                    <td className="px-4 py-4">
                      <StatusBadge status={act.phase || 'DEVELOPMENT'} className="text-[10px]" />
                    </td>

                    {/* Mandays Column */}
                    <td className="px-4 py-4 text-center text-sm font-mono text-on-surface-variant">
                      {isMilestone ? (
                        <span className="text-secondary text-xs">-</span>
                      ) : (
                        act.mandays !== undefined ? act.mandays : '0'
                      )}
                    </td>

                    {/* Schedule Column */}
                    <td className="px-4 py-4">
                      {act.startDate || act.endDate ? (
                        <div className="flex flex-col text-xs text-secondary gap-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-secondary/60 shrink-0" />
                            <span>{formatDate(act.startDate)} - {formatDate(act.endDate)}</span>
                          </div>
                          {act.durationDays !== undefined && (
                            <span className="font-medium text-[10px] text-primary/80 ml-4.5">
                              ({act.durationDays} Hari Kalender)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-secondary/40 font-normal">-</span>
                      )}
                    </td>

                    {/* Resource Column */}
                    <td className="px-4 py-4">
                      {act.assignedToId ? (
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                          <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span className="truncate max-w-[120px]">{getMemberName(act.assignedToId)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary/40 font-normal">-</span>
                      )}
                    </td>

                    {/* Progress Column */}
                    <td className="px-4 py-4">
                      {editingProgressId === act.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tempProgress}
                            onChange={(e) => setTempProgress(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineProgress(act.id);
                              if (e.key === 'Escape') setEditingProgressId(null);
                            }}
                            className="w-16 px-1.5 py-1 border border-primary rounded-md text-xs font-mono text-center bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => saveInlineProgress(act.id)}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                            title="Simpan"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingProgressId(null)}
                            className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                            title="Batal"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 group cursor-pointer"
                          onClick={() => startInlineEdit(act)}
                          title="Klik untuk ubah progress"
                        >
                          <div className="w-16 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                act.progressPct === 100 ? 'bg-emerald-500' : 'bg-primary'
                              }`} 
                              style={{ width: `${act.progressPct || 0}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold font-mono group-hover:text-primary transition-colors ${
                            act.progressPct === 100 ? 'text-emerald-600' : 'text-secondary'
                          }`}>
                            {act.progressPct || 0}%
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Add sub task (Only for parents) */}
                        {!act.parentId && !act.isMilestone && (
                          <button
                            onClick={() => onAddSubActivity(act.id)}
                            className="p-1 hover:bg-surface-container-high rounded text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Tambah Sub-Task"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditActivity(act)}
                          className="p-1 hover:bg-surface-container-high rounded text-secondary hover:text-on-background transition-colors cursor-pointer"
                          title="Ubah Aktivitas"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(act.id, act.activityName)}
                          className="p-1 hover:bg-surface-container-high rounded text-secondary hover:text-error transition-colors cursor-pointer"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
