import { useState } from 'react';
import {
  X,
  AlertTriangle,
  FolderKanban,
  Headphones,
  Trash2,
  LogOut,
  UserX,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';
import {
  useGetUsers,
  useGetMemberRelations,
  useRemoveMemberFromProject,
  useRemoveMemberFromSupport,
  useUnassignMemberActivity,
  useUnassignAllMemberActivities,
  useReassignProjectMember,
  useReassignSupportTicketMember,
  useReassignActivityMember,
  useReassignAllMemberRelations,
  useDeleteUser
} from '@/modules/master/users/hooks/useUsers';
import type {
  MemberProjectRelation,
  MemberSupportRelation,
  MemberActivityRelation
} from '@/modules/master/users/types';
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog';
import { StatusBadge } from '@/shared/components/common/StatusBadge';

interface MemberDeleteRelationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    fullName: string;
    employeeId?: string | null;
    email?: string | null;
  } | null;
  onSuccessDelete?: () => void;
}

export function MemberDeleteRelationsModal({
  isOpen,
  onClose,
  member,
  onSuccessDelete,
}: MemberDeleteRelationsModalProps) {
  const memberId = member?.id || null;
  const { data: relations, isLoading, refetch } = useGetMemberRelations(memberId);
  const { data: usersRes } = useGetUsers({ perPage: 200 });

  const removeProjectMutation = useRemoveMemberFromProject();
  const removeSupportMutation = useRemoveMemberFromSupport();
  const unassignActivityMutation = useUnassignMemberActivity();
  const unassignAllActivitiesMutation = useUnassignAllMemberActivities();
  
  const reassignProjectMutation = useReassignProjectMember();
  const reassignSupportMutation = useReassignSupportTicketMember();
  const reassignActivityMutation = useReassignActivityMember();
  const reassignAllMutation = useReassignAllMemberRelations();
  
  const deleteUserMutation = useDeleteUser();

  const [selectedBulkTargetId, setSelectedBulkTargetId] = useState('');
  const [selectedProjectTargets, setSelectedProjectTargets] = useState<Record<string, string>>({});
  const [selectedSupportTargets, setSelectedSupportTargets] = useState<Record<string, string>>({});
  const [selectedActivityTargets, setSelectedActivityTargets] = useState<Record<string, string>>({});

  const [isCascadeConfirmOpen, setIsCascadeConfirmOpen] = useState(false);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(true);
  const [actionError, setActionError] = useState('');

  if (!isOpen || !member) return null;

  const availableTargetMembers = (usersRes?.data || []).filter(
    (u) => u.id !== member.id && u.isActive
  );

  const projects = relations?.projects || [];
  const supports = relations?.supports || [];
  const activities = relations?.activities || [];
  const activityCount = relations?.activityCount ?? activities.length;
  const hasRelations = projects.length > 0 || supports.length > 0 || activities.length > 0 || activityCount > 0;

  const handleRemoveFromProject = (projectId: string) => {
    setActionError('');
    removeProjectMutation.mutate(
      { memberId: member.id, projectId },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => setActionError(err?.message || 'Gagal mengeluarkan member dari project'),
      }
    );
  };

  const handleRemoveFromSupport = (ticketId: string) => {
    setActionError('');
    removeSupportMutation.mutate(
      { memberId: member.id, ticketId },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => setActionError(err?.message || 'Gagal mengeluarkan member dari ticket support'),
      }
    );
  };

  const handleUnassignActivity = (activityId: string) => {
    setActionError('');
    unassignActivityMutation.mutate(
      { memberId: member.id, activityId },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => setActionError(err?.message || 'Gagal melepas assignment task'),
      }
    );
  };

  const handleUnassignAllActivities = () => {
    setActionError('');
    unassignAllActivitiesMutation.mutate(member.id, {
      onSuccess: () => refetch(),
      onError: (err: any) => setActionError(err?.message || 'Gagal melepas semua task'),
    });
  };

  const handleReassignAll = () => {
    if (!selectedBulkTargetId) return;
    setActionError('');
    reassignAllMutation.mutate(
      { fromMemberId: member.id, toMemberId: selectedBulkTargetId },
      {
        onSuccess: () => {
          setSelectedBulkTargetId('');
          refetch();
        },
        onError: (err: any) => setActionError(err?.message || 'Gagal mengalihkan semua relasi member'),
      }
    );
  };

  const handleReassignProject = (projectId: string) => {
    const targetId = selectedProjectTargets[projectId];
    if (!targetId) return;
    setActionError('');
    reassignProjectMutation.mutate(
      { fromMemberId: member.id, toMemberId: targetId, projectId },
      {
        onSuccess: () => {
          setSelectedProjectTargets((prev) => ({ ...prev, [projectId]: '' }));
          refetch();
        },
        onError: (err: any) => setActionError(err?.message || 'Gagal mengalihkan member di project'),
      }
    );
  };

  const handleReassignSupport = (ticketId: string) => {
    const targetId = selectedSupportTargets[ticketId];
    if (!targetId) return;
    setActionError('');
    reassignSupportMutation.mutate(
      { fromMemberId: member.id, toMemberId: targetId, ticketId },
      {
        onSuccess: () => {
          setSelectedSupportTargets((prev) => ({ ...prev, [ticketId]: '' }));
          refetch();
        },
        onError: (err: any) => setActionError(err?.message || 'Gagal mengalihkan member di tiket support'),
      }
    );
  };

  const handleReassignActivity = (activityId: string) => {
    const targetId = selectedActivityTargets[activityId];
    if (!targetId) return;
    setActionError('');
    reassignActivityMutation.mutate(
      { fromMemberId: member.id, toMemberId: targetId, activityId },
      {
        onSuccess: () => {
          setSelectedActivityTargets((prev) => ({ ...prev, [activityId]: '' }));
          refetch();
        },
        onError: (err: any) => setActionError(err?.message || 'Gagal mengalihkan tugas task'),
      }
    );
  };

  const handleConfirmCascadeDelete = () => {
    setActionError('');
    deleteUserMutation.mutate(member.id, {
      onSuccess: () => {
        setIsCascadeConfirmOpen(false);
        onClose();
        if (onSuccessDelete) onSuccessDelete();
      },
      onError: (err: any) => {
        setActionError(err?.message || 'Gagal menghapus member');
        setIsCascadeConfirmOpen(false);
      },
    });
  };

  const isAnyActionPending =
    removeProjectMutation.isPending ||
    removeSupportMutation.isPending ||
    unassignActivityMutation.isPending ||
    unassignAllActivitiesMutation.isPending ||
    reassignProjectMutation.isPending ||
    reassignSupportMutation.isPending ||
    reassignActivityMutation.isPending ||
    reassignAllMutation.isPending;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-error-container/20 text-error flex items-center justify-center border border-error/20">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-background">Hapus Member</h2>
                <p className="text-xs text-secondary">
                  {member.fullName} {member.employeeId ? `(${member.employeeId})` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-on-background hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
            {actionError && (
              <div className="p-3 bg-error-container/20 border border-error/30 text-error text-xs font-semibold rounded-lg">
                {actionError}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-xs text-secondary">Memeriksa relasi dan penugasan member...</span>
              </div>
            ) : hasRelations ? (
              <>
                {/* Warning Card */}
                <div className="bg-warning-container/15 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold text-on-warning-container text-sm">
                      Member Masih Memiliki Relasi & Penugasan Aktif
                    </span>
                    <p className="text-secondary leading-relaxed">
                      Member ini terdaftar di{' '}
                      <strong className="text-on-surface">{projects.length} Project</strong>,{' '}
                      <strong className="text-on-surface">{supports.length} Tiket Support</strong>
                      {activityCount > 0 && (
                        <>
                          , dan memegang{' '}
                          <strong className="text-on-surface">{activityCount} Task/Aktivitas</strong>
                        </>
                      )}
                      . Anda dapat mengalihkan (reassign) seluruh/sebagian relasi ke member lain, mengeluarkan dari item spesifik, atau menghapus permanen.
                    </p>
                  </div>
                </div>

                {/* Bulk Reassign Card */}
                <div className="bg-surface-container-low border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-background">Alihkan Semua Relasi Sekaligus</span>
                      <span className="text-[11px] text-secondary">Pindahkan seluruh project, support, & task ke member baru</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <select
                      value={selectedBulkTargetId}
                      onChange={(e) => setSelectedBulkTargetId(e.target.value)}
                      disabled={isAnyActionPending}
                      className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:border-primary w-full sm:w-48"
                    >
                      <option value="">-- Pilih Member Pengganti --</option>
                      {availableTargetMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.employeeId ? `(${m.employeeId})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleReassignAll}
                      disabled={!selectedBulkTargetId || reassignAllMutation.isPending || isAnyActionPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{reassignAllMutation.isPending ? 'Mengalihkan...' : 'Alihkan Semua'}</span>
                    </button>
                  </div>
                </div>

                {/* Projects Section */}
                {projects.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-primary" />
                        Terdaftar di Project ({projects.length})
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {projects.map((p: MemberProjectRelation) => {
                        const targetId = selectedProjectTargets[p.projectId] || '';
                        return (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low transition-colors gap-3"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {p.projectCode}
                                </span>
                                <span className="font-semibold text-sm text-on-background">{p.projectName}</span>
                                <StatusBadge status={p.status} />
                              </div>
                              <span className="text-xs text-secondary">
                                Role: <strong className="text-on-surface">{p.roleName}</strong>
                                {p.assignedMandays > 0 && ` • Alokasi: ${p.assignedMandays} Mandays`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                              <select
                                value={targetId}
                                onChange={(e) =>
                                  setSelectedProjectTargets((prev) => ({
                                    ...prev,
                                    [p.projectId]: e.target.value,
                                  }))
                                }
                                disabled={isAnyActionPending}
                                className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:border-primary max-w-[160px]"
                              >
                                <option value="">Alihkan ke...</option>
                                {availableTargetMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.fullName}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleReassignProject(p.projectId)}
                                disabled={!targetId || reassignProjectMutation.isPending || isAnyActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Alihkan member di project ini"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Alihkan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromProject(p.projectId)}
                                disabled={removeProjectMutation.isPending || isAnyActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Keluarkan member dari project ini"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Keluarkan</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Support Tickets Section */}
                {supports.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-teal-600" />
                        Terdaftar di Support Ticket ({supports.length})
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {supports.map((s: MemberSupportRelation) => {
                        const targetId = selectedSupportTargets[s.ticketId] || '';
                        return (
                          <div
                            key={s.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low transition-colors gap-3"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-500/10 px-1.5 py-0.5 rounded">
                                  {s.ticketCode}
                                </span>
                                <span className="font-semibold text-sm text-on-background line-clamp-1">
                                  {s.issueTitle}
                                </span>
                                <StatusBadge status={s.status} />
                              </div>
                              <span className="text-xs text-secondary">
                                Role: <strong className="text-on-surface">{s.roleName}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                              <select
                                value={targetId}
                                onChange={(e) =>
                                  setSelectedSupportTargets((prev) => ({
                                    ...prev,
                                    [s.ticketId]: e.target.value,
                                  }))
                                }
                                disabled={isAnyActionPending}
                                className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:border-primary max-w-[160px]"
                              >
                                <option value="">Alihkan ke...</option>
                                {availableTargetMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.fullName}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleReassignSupport(s.ticketId)}
                                disabled={!targetId || reassignSupportMutation.isPending || isAnyActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 border border-teal-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Alihkan member di support ini"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Alihkan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromSupport(s.ticketId)}
                                disabled={removeSupportMutation.isPending || isAnyActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Keluarkan member dari support ini"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Keluarkan</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Project Tasks / Activities Section */}
                {activities.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
                        className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 hover:text-on-background transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Task / Aktivitas Project ({activities.length})</span>
                        {isActivitiesExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-1" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleUnassignAllActivities}
                        disabled={unassignAllActivitiesMutation.isPending || isAnyActionPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-warning-strong hover:bg-warning-container/20 border border-warning/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Lepaskan semua tugas dari member ini"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Lepas Semua Task</span>
                      </button>
                    </div>

                    {isActivitiesExpanded && (
                      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {activities.map((act: MemberActivityRelation) => {
                          const targetId = selectedActivityTargets[act.id] || '';
                          return (
                            <div
                              key={act.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low transition-colors gap-3"
                            >
                              <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-on-background line-clamp-1">
                                    {act.activityName}
                                  </span>
                                  {act.phase && (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container-high text-secondary">
                                      {act.phase}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-secondary flex-wrap">
                                  <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1 py-0.2 rounded">
                                    {act.projectCode}
                                  </span>
                                  <span className="text-on-surface line-clamp-1">{act.projectName}</span>
                                  {act.feature && <span>• Fitur: {act.feature}</span>}
                                  {typeof act.progressPct === 'number' && (
                                    <span>• Progress: {act.progressPct}%</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                                <select
                                  value={targetId}
                                  onChange={(e) =>
                                    setSelectedActivityTargets((prev) => ({
                                      ...prev,
                                      [act.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isAnyActionPending}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:border-primary max-w-[160px]"
                                >
                                  <option value="">Alihkan ke...</option>
                                  {availableTargetMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.fullName}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleReassignActivity(act.id)}
                                  disabled={!targetId || reassignActivityMutation.isPending || isAnyActionPending}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Alihkan task ini ke member lain"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>Alihkan</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUnassignActivity(act.id)}
                                  disabled={unassignActivityMutation.isPending || isAnyActionPending}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Lepaskan task ini dari member"
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>Lepas</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback info when activityCount > 0 but activities list empty */}
                {activityCount > 0 && activities.length === 0 && projects.length === 0 && supports.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-secondary bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>
                      Member ini tercatat pernah memegang {activityCount} task/subtask aktivitas project.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm text-on-background">Tidak Ada Relasi Aktif</span>
                  <p className="text-xs text-secondary max-w-sm">
                    Member <strong>"{member.fullName}"</strong> tidak terdaftar pada project atau tiket support
                    mana pun. Akun ini aman untuk langsung dihapus.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-outline-variant bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-secondary hover:text-on-background hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={() => setIsCascadeConfirmOpen(true)}
              disabled={deleteUserMutation.isPending || isAnyActionPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-error text-on-error hover:bg-error/90 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {hasRelations ? 'Hapus Semua & Hapus Member' : 'Hapus Member'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Final Delete */}
      <ConfirmDialog
        isOpen={isCascadeConfirmOpen}
        onClose={() => setIsCascadeConfirmOpen(false)}
        onConfirm={handleConfirmCascadeDelete}
        title="Hapus Member Permanen?"
        message={`Apakah Anda yakin ingin menghapus member "${member.fullName}" beserta seluruh relasi penugasannya? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </>
  );
}
