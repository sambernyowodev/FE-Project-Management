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
  Layers
} from 'lucide-react';
import {
  useGetMemberRelations,
  useRemoveMemberFromProject,
  useRemoveMemberFromSupport,
  useDeleteUser
} from '@/modules/master/users/hooks/useUsers';
import type { MemberProjectRelation, MemberSupportRelation } from '@/modules/master/users/types';
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

  const removeProjectMutation = useRemoveMemberFromProject();
  const removeSupportMutation = useRemoveMemberFromSupport();
  const deleteUserMutation = useDeleteUser();

  const [isCascadeConfirmOpen, setIsCascadeConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!isOpen || !member) return null;

  const projects = relations?.projects || [];
  const supports = relations?.supports || [];
  const activityCount = relations?.activityCount || 0;
  const hasRelations = projects.length > 0 || supports.length > 0 || activityCount > 0;

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
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
                      Member Masih Memiliki Relasi Aktif
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
                      . Anda dapat mengeluarkan member dari project/support tertentu, atau menghapus permanen
                      secara keseluruhan.
                    </p>
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
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {projects.map((p: MemberProjectRelation) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={() => handleRemoveFromProject(p.projectId)}
                            disabled={removeProjectMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                            title="Keluarkan member dari project ini"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluarkan</span>
                          </button>
                        </div>
                      ))}
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
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {supports.map((s: MemberSupportRelation) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-low/40 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSupport(s.ticketId)}
                            disabled={removeSupportMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                            title="Keluarkan member dari support ini"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluarkan</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activityCount > 0 && projects.length === 0 && supports.length === 0 && (
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
              disabled={deleteUserMutation.isPending}
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
