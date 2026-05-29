import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetSupportTicket } from '@/modules/support/hooks/useSupportTickets';
import { ManageSupportMembersModal } from './components/ManageSupportMembersModal';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { SupportTicketStatus } from '@/shared/constants/enums';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Users,
  Briefcase,
  Layers,
  Edit,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/shared/lib/formatter';

export function SupportTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const { data: ticket, isLoading, refetch } = useGetSupportTicket(ticketId);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Memuat data tiket...</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-secondary">
        Tiket tidak ditemukan. Silakan pilih tiket lain dari daftar.
      </div>
    );
  }

  const assignees = ticket.assignees || [];
  const totalHoursAssigned = assignees.reduce((acc: number, curr: any) => acc + Number(curr.hoursSpent || 0), 0);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAvatarBg = (id: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-sky-600'
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Upper Navigation and Header */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/support')}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
            title="Kembali ke Daftar Tiket"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">Manajemen Alokasi Tiket</h1>
            <p className="text-secondary text-sm">Alokasi tim member, jam kerja, dan status pengerjaan tiket support.</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/support/${ticket.id}`)}
          className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low text-xs font-bold text-secondary transition-all cursor-pointer shadow-sm"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Tiket</span>
        </button>
      </div>

      {/* Ticket Details Summary Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-outline-variant/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-on-background">{ticket.masterProject?.name
                  || 'Project Tanpa Nama'}</h2>
                <span className="text-xs font-mono text-secondary px-2 py-0.5 bg-surface rounded border border-outline-variant">
                  {ticket.ticketCode}
                </span>
              </div>
              <p className="text-xs text-secondary mt-1 flex items-center gap-4">
                <span>Customer: <strong className="text-on-background">{ticket.customer || '-'}</strong></span>
                <span>PIC Client: <strong className="text-on-background">{ticket.picClient || '-'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.status || SupportTicketStatus.OPEN} />
          </div>
        </div>

        {/* Issue Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Judul Kendala</span>
            <h3 className="text-base font-bold text-on-background leading-normal">{ticket.issueTitle}</h3>
            {ticket.issueDescription && (
              <div className="bg-surface p-4 rounded-xl border border-outline-variant/60 text-sm text-secondary leading-relaxed mt-1">
                <p className="whitespace-pre-wrap">{ticket.issueDescription}</p>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="lg:col-span-1 flex flex-col gap-4 bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/60">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold uppercase tracking-wider">Metrik Tiket</span>
            </div>

            <div className="flex flex-col gap-3 font-semibold text-sm">
              <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                <span className="text-secondary flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Total Hours Tiket:
                </span>
                <span className="font-mono text-on-background">{Number(ticket.hoursSpent || 0).toFixed(1)} jam</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                <span className="text-secondary flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Total Assigned Hours:
                </span>
                <span className="font-mono text-on-background">{totalHoursAssigned.toFixed(1)} jam</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-secondary flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Tanggal Dibuat:
                </span>
                <span className="text-on-background">{formatDate(ticket.createdAt, 'short')}</span>
              </div>
            </div>

            {totalHoursAssigned > Number(ticket.hoursSpent || 0) && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Jam kerja kumulatif member ({totalHoursAssigned} jam) melebihi alokasi jam tiket ({ticket.hoursSpent} jam).</p>
              </div>
            )}
          </div>
        </div>

        {ticket.notes && (
          <div className="border-t border-outline-variant/60 pt-4 flex flex-col gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Catatan Penyelesaian Internal</span>
            </span>
            <p className="text-xs text-secondary leading-relaxed bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/40">
              {ticket.notes}
            </p>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-on-background">Tim Assigned</h3>
            <p className="text-xs text-secondary mt-0.5">Daftar member aktif yang dialokasikan khusus untuk pengerjaan tiket ini.</p>
          </div>

          <button
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-xs font-bold shadow-sm w-full sm:w-auto justify-center cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Tim</span>
          </button>
        </div>

        {/* Members Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          {assignees.length === 0 ? (
            <div className="text-center py-20 text-secondary flex flex-col items-center justify-center gap-3">
              <Users className="w-10 h-10 text-secondary/40" />
              <div>
                <p className="font-bold text-on-background text-sm">Belum ada Assignee</p>
                <p className="text-xs text-secondary mt-0.5">Klik tombol Kelola Tim di atas untuk menambahkan member ke tiket.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                    <th className="px-6 py-3.5">Nama Member</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Jadwal Penugasan</th>
                    <th className="px-6 py-3.5 text-right">Hours Logged</th>
                    <th className="px-6 py-3.5">Status Kerja</th>
                    <th className="px-6 py-3.5">Catatan/Perkembangan</th>
                    <th className="px-6 py-3.5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 text-xs">
                  {assignees.map((assignee: any) => {
                    const userName = assignee.user?.fullName || `User ID: ${assignee.userId}`;
                    const userEmail = assignee.user?.email || '';

                    return (
                      <tr key={assignee.id} className="hover:bg-surface-container-lowest/40 transition-colors">
                        {/* Member Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarBg(assignee.userId)} text-white text-[10px] font-bold flex items-center justify-center shadow-inner shrink-0`}>
                              {getInitials(userName)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-on-background truncate">{userName}</span>
                              <span className="text-[10px] text-secondary truncate">{userEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignee.role?.name ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                              {assignee.role.name}
                            </span>
                          ) : (
                            <span className="italic text-secondary/40">-</span>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="px-6 py-4 whitespace-nowrap text-secondary font-medium">
                          {assignee.startDate ? (
                            <span>{formatDate(assignee.startDate, 'short')} s/d {assignee.endDate ? formatDate(assignee.endDate, 'short') : '-'}</span>
                          ) : (
                            <span className="italic text-secondary/50">-</span>
                          )}
                        </td>

                        {/* Hours spent */}
                        <td className="px-6 py-4 text-right font-mono font-semibold text-on-background">
                          {Number(assignee.hoursSpent || 0).toFixed(2)} hrs
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${assignee.status === 'DONE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : assignee.status === 'IN PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : assignee.status === 'ON HOLD'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-surface text-secondary border-outline-variant'
                            }`}>
                            {assignee.status || 'OPEN'}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="px-6 py-4">
                          <p className="text-secondary line-clamp-2 max-w-sm leading-normal">
                            {assignee.notes || <span className="italic text-secondary/40">Tidak ada catatan</span>}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setIsManageModalOpen(true)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Kelola
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      <ManageSupportMembersModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          refetch();
        }}
        ticketId={ticketId}
        assignees={assignees}
      />
    </div>
  );
}
