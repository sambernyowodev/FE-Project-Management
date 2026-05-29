import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Trash2, Award, Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { useGetUsers } from '@/modules/master/users/hooks/useUsers';
import { useGetRoles } from '@/modules/master/roles/hooks/useRoles';
import {
  useAddTicketAssignee,
  useUpdateTicketAssignee,
  useRemoveTicketAssignee
} from '@/modules/support/hooks/useSupportTickets';
import { SupportTicketStatus } from '@/shared/constants/enums';

interface ManageSupportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  assignees: any[];
}

export function ManageSupportMembersModal({ isOpen, onClose, ticketId, assignees }: ManageSupportMembersModalProps) {
  const { data: usersRes } = useGetUsers({ perPage: 200 });
  const { data: rolesRes } = useGetRoles();
  const addAssigneeMutation = useAddTicketAssignee(ticketId);
  const updateAssigneeMutation = useUpdateTicketAssignee(ticketId);
  const removeAssigneeMutation = useRemoveTicketAssignee(ticketId);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [hoursSpent, setHoursSpent] = useState('0');
  const [status, setStatus] = useState<keyof typeof SupportTicketStatus>(SupportTicketStatus.OPEN);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Editing state
  const [editingAssigneeId, setEditingAssigneeId] = useState<number | null>(null);

  // Searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const activeUsers = (usersRes?.data || []).filter((u: any) => u.isActive);
  const roles = rolesRes || [];

  // Filter out users already assigned, except the one being edited
  const getFilteredUsers = () => {
    return activeUsers.filter((u: any) => {
      const isAlreadyAssigned = assignees.some(
        (a: any) => a.userId === u.id && a.id !== editingAssigneeId
      );
      const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      return !isAlreadyAssigned && matchesSearch;
    });
  };

  const handleSelectUser = (user: any) => {
    setSelectedUserId(String(user.id));
    setSearchQuery(user.fullName);
    setIsDropdownOpen(false);
  };

  const handleEditClick = (assignee: any) => {
    setEditingAssigneeId(assignee.id);
    setSelectedUserId(String(assignee.userId));
    setSelectedRoleId(assignee.roleId ? String(assignee.roleId) : '');
    setSearchQuery(assignee.user?.fullName || '');
    setHoursSpent(String(assignee.hoursSpent || 0));
    setStatus(assignee.status || SupportTicketStatus.OPEN);
    setStartDate(assignee.startDate ? assignee.startDate.substring(0, 10) : '');
    setEndDate(assignee.endDate ? assignee.endDate.substring(0, 10) : '');
    setNotes(assignee.notes || '');
    setError('');
  };

  const resetForm = () => {
    setEditingAssigneeId(null);
    setSelectedUserId('');
    setSelectedRoleId('');
    setSearchQuery('');
    setHoursSpent('0');
    setStatus(SupportTicketStatus.OPEN);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('Silakan pilih user terlebih dahulu');
      return;
    }

    const payload: any = {
      userId: Number(selectedUserId),
      roleId: selectedRoleId ? Number(selectedRoleId) : undefined,
      hoursSpent: Number(hoursSpent) || 0,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      notes: notes || undefined,
    };

    if (editingAssigneeId) {
      updateAssigneeMutation.mutate(
        { assigneeId: editingAssigneeId, data: payload },
        {
          onSuccess: () => {
            resetForm();
          },
          onError: (err: any) => {
            setError(err.message || 'Gagal mengubah alokasi member');
          },
        }
      );
    } else {
      addAssigneeMutation.mutate(payload, {
        onSuccess: () => {
          resetForm();
        },
        onError: (err: any) => {
          setError(err.message || 'Gagal menambahkan member');
        },
      });
    }
  };

  const handleRemoveAssignee = (id: number, userName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin mengeluarkan ${userName} dari ticket support ini?`)) {
      removeAssigneeMutation.mutate(id, {
        onError: (err: any) => {
          setError(err.message || 'Gagal menghapus member');
        },
      });
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div>
            <h3 className="text-lg font-bold text-on-background">Kelola Tim Support</h3>
            <p className="text-xs text-secondary mt-0.5">Alokasikan anggota tim yang menangani tiket support ini.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Allocation Form */}
          <div className="flex-1 flex flex-col gap-4">
            <form onSubmit={handleSave} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/60 pb-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>{editingAssigneeId ? 'Update Alokasi Member' : 'Alokasi Member Baru'}</span>
              </h4>

              {error && (
                <div className="p-2.5 bg-error-container text-error text-xs rounded-lg border border-error/20 font-medium">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select User (Searchable Dropdown) */}
                <div className="flex flex-col gap-1.5" ref={dropdownRef}>
                  <label className="text-xs font-bold text-on-background">Pilih User *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama atau email user..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                        if (selectedUserId) setSelectedUserId('');
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      disabled={Boolean(editingAssigneeId)}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
                    />
                    {isDropdownOpen && !editingAssigneeId && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg flex flex-col p-1 max-h-48 overflow-y-auto">
                        {getFilteredUsers().length > 0 ? (
                          getFilteredUsers().map((u: any) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectUser(u)}
                              className="px-3 py-2 text-left text-xs hover:bg-surface-container-low rounded transition-colors flex justify-between items-center cursor-pointer"
                            >
                              <span className="font-bold text-on-background">{u.fullName}</span>
                              <span className="text-secondary text-[10px]">{u.email}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-secondary text-center">
                            Tidak ditemukan user aktif
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-background">Pilih Role</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  >
                    <option value="">-- Pilih Role --</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hours Spent & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-background">Hours Spent (Jam)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-background">Status Kerja</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as keyof typeof SupportTicketStatus)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={SupportTicketStatus.OPEN}>OPEN</option>
                    <option value={SupportTicketStatus.IN_PROGRESS}>IN PROGRESS</option>
                    <option value={SupportTicketStatus.DONE}>DONE</option>
                    <option value={SupportTicketStatus.ON_HOLD}>ON HOLD</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-background">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-background">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-background">Catatan Kerja</label>
                <textarea
                  rows={3}
                  placeholder="Tambahkan catatan perkembangan pengerjaan oleh member..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 justify-end border-t border-outline-variant/60 pt-3 mt-1">
                {editingAssigneeId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors text-xs font-bold cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={addAssigneeMutation.isPending || updateAssigneeMutation.isPending}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{editingAssigneeId ? 'Simpan Perubahan' : 'Tambah Ke Tiket'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Current Assignees List */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Daftar Assignee Aktif ({assignees.length} Member)
            </h4>

            {assignees.length === 0 ? (
              <div className="text-center py-16 text-secondary border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low/20">
                Belum ada tim member yang ditugaskan untuk tiket ini.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {assignees.map((assignee: any) => {
                  const userName = assignee.user?.fullName || `User ID: ${assignee.userId}`;
                  const userEmail = assignee.user?.email || '';
                  const roleName = assignee.role?.name || '';

                  return (
                    <div
                      key={assignee.id}
                      className={`flex flex-col gap-2.5 p-3.5 rounded-xl border transition-all ${editingAssigneeId === assignee.id
                        ? 'border-primary bg-primary/5 shadow-inner'
                        : 'border-outline-variant/60 bg-surface hover:bg-surface-container-low/40'
                        }`}
                    >
                      <div className="flex items-center justify-between min-w-0 gap-4">
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                          onClick={() => handleEditClick(assignee)}
                          title="Klik untuk edit alokasi"
                        >
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarBg(assignee.userId)} text-white text-xs font-bold flex items-center justify-center shadow-inner shrink-0`}>
                            {getInitials(userName)}
                          </div>
                          {/* User Details */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-on-background truncate hover:underline">{userName}</span>
                              {roleName && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                  {roleName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-secondary truncate">{userEmail}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(assignee.id, userName)}
                            disabled={removeAssigneeMutation.isPending}
                            className="p-1.5 border border-outline-variant hover:border-error/30 hover:bg-error/5 text-secondary hover:text-error rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            title="Hapus dari Tiket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Allocations Info Grid */}
                      <div
                        className="grid grid-cols-2 gap-2 text-[10px] border-t border-outline-variant/40 pt-2 text-secondary font-medium cursor-pointer"
                        onClick={() => handleEditClick(assignee)}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary/70" />
                          <span>Waktu: <strong className="text-on-background font-mono">{assignee.hoursSpent || 0} jam</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-primary/70" />
                          <span>Status: <strong className="text-on-background">{assignee.status || 'OPEN'}</strong></span>
                        </div>
                        {(assignee.startDate || assignee.endDate) && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            <span>Jadwal: <strong className="text-on-background">
                              {assignee.startDate ? assignee.startDate.substring(0, 10) : ''} s/d {assignee.endDate ? assignee.endDate.substring(0, 10) : '-'}
                            </strong></span>
                          </div>
                        )}
                        {assignee.notes && (
                          <div className="col-span-2 flex items-start gap-1 text-[9px] text-secondary/90 bg-surface-container-low p-2 rounded-lg border border-outline-variant/40 mt-1">
                            <FileText className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-normal">{assignee.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
