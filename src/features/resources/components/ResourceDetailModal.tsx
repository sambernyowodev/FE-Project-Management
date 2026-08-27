import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FolderKanban,
  TicketCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import type { ResourceMember } from '@/modules/resources/types';
import { StatusBadge } from '@/shared/components/common/StatusBadge';

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceMember | null;
}

export function ResourceDetailModal({ isOpen, onClose, resource }: ResourceDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  if (!isOpen || !resource) return null;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAvatarBg = (id: string) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-sky-600'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header Profile */}
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarBg(resource.id)} text-white text-lg font-black flex items-center justify-center shadow-md shrink-0`}>
              {getInitials(resource.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-on-background">{resource.fullName}</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  resource.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${resource.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {resource.isActive ? 'Active Member' : 'Inactive Member'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary mt-1">
                <span>NIP: <strong className="font-mono text-on-background">{resource.employeeId}</strong></span>
                <span>Email: <strong className="text-on-background">{resource.email}</strong></span>
                <span>Role Utama: <strong className="text-primary">{resource.primaryRole}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workload Status Pill Banner */}
        <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary">Status Beban Saat Ini:</span>
            {resource.isIdle ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Idle (Tersedia / Siap Dialokasikan)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {resource.workloadLabel}
              </span>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium text-secondary">
            <span className="flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <strong>{resource.activeProjectCount}</strong> Project Aktif
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <TicketCheck className="w-3.5 h-3.5 text-purple-600" />
              <strong>{resource.activeSupportCount}</strong> Support Aktif
            </span>
            <span>•</span>
            <span>
              Total Selesai: <strong>{resource.completedProjectCount + resource.completedSupportCount}</strong>
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-outline-variant bg-surface-container-lowest flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pekerjaan Sedang Dipegang ({resource.totalActiveWorkload})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:bg-surface-container-high'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Riwayat Selesai ({resource.completedProjectCount + resource.completedSupportCount})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {activeTab === 'active' ? (
            <div className="flex flex-col gap-6">
              {/* Active Projects Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <span>Project yang Belum Close ({resource.activeProjects.length})</span>
                  </span>
                  <span className="text-[11px] font-medium text-secondary">
                    Total Mandays: {resource.totalAssignedMandays.toFixed(1)} md
                  </span>
                </h4>

                {resource.activeProjects.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-center text-xs text-secondary">
                    Tidak ada project aktif yang sedang dipegang.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resource.activeProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-primary/40 transition-all shadow-sm"
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono text-secondary">{proj.projectCode}</span>
                              <h5 className="text-sm font-bold text-on-background leading-snug">{proj.projectName}</h5>
                            </div>
                            <StatusBadge status={proj.status as any} />
                          </div>
                          {proj.customer && (
                            <span className="text-[11px] text-secondary">Customer: <strong>{proj.customer}</strong></span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-semibold text-secondary">
                            <span>Project Progress</span>
                            <span className="text-primary font-bold">{proj.progressPct || 0}%</span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${proj.progressPct || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Footer details & Action */}
                        <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                              {proj.roleName || 'Resource'}
                            </span>
                            {proj.assignedMandays ? (
                              <span className="text-secondary font-mono">
                                {proj.assignedMandays} md
                              </span>
                            ) : null}
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/projects/${proj.projectId}/timeline`);
                            }}
                            className="flex items-center gap-1 text-primary hover:underline font-bold cursor-pointer"
                          >
                            <span>Buka Timeline</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Support Tickets Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TicketCheck className="w-4 h-4 text-purple-600" />
                    <span>Tiket Support yang Belum Close ({resource.activeSupports.length})</span>
                  </span>
                  <span className="text-[11px] font-medium text-secondary">
                    Total Jam Kerja: {resource.totalSupportHours} Jam
                  </span>
                </h4>

                {resource.activeSupports.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-center text-xs text-secondary">
                    Tidak ada tiket support aktif yang sedang dipegang.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resource.activeSupports.map(sup => (
                      <div
                        key={sup.id}
                        className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-purple-500/40 transition-all shadow-sm"
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono text-purple-600 font-bold">{sup.ticketCode}</span>
                              <h5 className="text-sm font-bold text-on-background leading-snug">{sup.issueTitle}</h5>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase">
                              {sup.status}
                            </span>
                          </div>
                          {sup.projectName && (
                            <span className="text-[11px] text-secondary">Project: <strong>{sup.projectName}</strong></span>
                          )}
                        </div>

                        {/* Footer details & Action */}
                        <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 border border-purple-500/20 font-semibold">
                              {sup.roleName || 'Assignee'}
                            </span>
                            <span className="text-secondary font-mono">
                              {sup.hoursSpent} jam
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/support/${sup.ticketId}/timeline`);
                            }}
                            className="flex items-center gap-1 text-purple-600 hover:underline font-bold cursor-pointer"
                          >
                            <span>Buka Support</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Completed Projects */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span>Riwayat Project Selesai / Closed ({resource.completedProjects.length})</span>
                </h4>

                {resource.completedProjects.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-center text-xs text-secondary">
                    Belum ada riwayat project yang berstatus CLOSED.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resource.completedProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="bg-surface-container-low/60 border border-outline-variant/60 rounded-xl p-4 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono text-secondary">{proj.projectCode}</span>
                            <h5 className="text-sm font-bold text-on-background">{proj.projectName}</h5>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
                            CLOSED
                          </span>
                        </div>
                        <div className="text-[11px] text-secondary flex justify-between">
                          <span>Role: <strong>{proj.roleName || '-'}</strong></span>
                          <span>Mandays: <strong>{proj.assignedMandays || 0} md</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Support */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <TicketCheck className="w-4 h-4 text-emerald-600" />
                  <span>Riwayat Tiket Support Selesai / Done ({resource.completedSupports.length})</span>
                </h4>

                {resource.completedSupports.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-center text-xs text-secondary">
                    Belum ada riwayat tiket support yang berstatus DONE.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resource.completedSupports.map(sup => (
                      <div
                        key={sup.id}
                        className="bg-surface-container-low/60 border border-outline-variant/60 rounded-xl p-4 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono text-purple-600 font-bold">{sup.ticketCode}</span>
                            <h5 className="text-sm font-bold text-on-background">{sup.issueTitle}</h5>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            DONE
                          </span>
                        </div>
                        <div className="text-[11px] text-secondary flex justify-between">
                          <span>Project: <strong>{sup.projectName || '-'}</strong></span>
                          <span>Jam Kerja: <strong>{sup.hoursSpent || 0} jam</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-background rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
