import React, { useState } from 'react';
import { X, UserPlus, Trash2, Award } from 'lucide-react';
import { useGetUsers } from '@/modules/master/users/hooks/useUsers';
import { useGetRoles } from '@/modules/master/roles/hooks/useRoles';
import { useAddProjectMember, useRemoveProjectMember } from '@/modules/projects/hooks/useProjects';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: any[];
  activities?: any[];
}

export function ManageMembersModal({ isOpen, onClose, projectId, members, activities = [] }: ManageMembersModalProps) {
  const { data: usersRes } = useGetUsers({ perPage: 200 });
  const { data: rolesRes } = useGetRoles();

  const addMemberMutation = useAddProjectMember(projectId);
  const removeMemberMutation = useRemoveProjectMember(projectId);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [error, setError] = useState('');

  const getCalculatedMandays = (userId: number) => {
    return activities
      .filter((act: any) => act.assignedToId === userId)
      .reduce((sum: number, act: any) => sum + (act.mandays || 0), 0);
  };

  if (!isOpen) return null;

  const activeUsers = (usersRes?.data || []).filter((u: any) => u.isActive);
  const roles = rolesRes || [];

  // Exclude users already having the specific role in the project
  const getFilteredUsers = () => {
    if (!selectedRoleId) return activeUsers;
    return activeUsers.filter((u: any) => {
      const alreadyHasRole = members.some(
        (m: any) => m.userId === u.id && String(m.roleId) === String(selectedRoleId)
      );
      return !alreadyHasRole;
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId || !selectedRoleId) {
      setError('Silakan pilih user dan role terlebih dahulu');
      return;
    }

    addMemberMutation.mutate(
      {
        userId: Number(selectedUserId),
        roleId: Number(selectedRoleId),
        assignedMandays: 0,
      },
      {
        onSuccess: () => {
          setSelectedUserId('');
          setSelectedRoleId('');
        },
        onError: (err: any) => {
          setError(err.message || 'Gagal menambahkan member');
        },
      }
    );
  };

  const handleRemoveMember = (memberId: number) => {
    if (window.confirm('Apakah Anda yakin ingin mengeluarkan member ini dari project?')) {
      removeMemberMutation.mutate(memberId, {
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
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div>
            <h3 className="text-lg font-bold text-on-background">Kelola Team Member</h3>
            <p className="text-xs text-secondary mt-0.5">Alokasikan user yang aktif ke project beserta role penugasannya.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {error && (
            <div className="p-3 bg-error-container text-error text-sm rounded-lg border border-error/20 font-medium">
              {error}
            </div>
          )}

          {/* Allocation Form Card */}
          <form onSubmit={handleAddMember} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              <span>Alokasi Member Baru</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Select User */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-background">Pilih User *</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">-- Pilih User --</option>
                  {getFilteredUsers().map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-background">Pilih Role *</label>
                <select
                  required
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="w-full px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer h-[38px] flex items-center justify-center gap-1"
              >
                <span>Tambah Member</span>
              </button>
            </div>
          </form>

          {/* Current Members List */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Daftar Team Ter-alokasi ({members.length} Member)
            </h4>

            {members.length === 0 ? (
              <div className="text-center py-8 text-secondary border-2 border-dashed border-outline-variant rounded-xl">
                Belum ada team member yang dialokasikan untuk project ini.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {members.map((member: any) => {
                  const userName = member.user?.fullName || `User ID: ${member.userId}`;
                  const userEmail = member.user?.email || '';
                  const roleName = member.role?.name || 'Resource';

                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline-variant/60 hover:bg-surface-container-low/40 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarBg(member.userId)} text-white text-xs font-bold flex items-center justify-center shadow-inner shrink-0`}>
                          {getInitials(userName)}
                        </div>
                        {/* User Details */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-on-background truncate">{userName}</span>
                          <span className="text-[10px] text-secondary truncate">{userEmail}</span>
                        </div>
                      </div>

                      {/* Right Details (Role, Mandays, Remove Button) */}
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Role Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                          <Award className="w-3 h-3" />
                          {roleName}
                        </span>

                        {/* Mandays */}
                        <span className="text-xs text-primary font-bold font-mono shrink-0" title="Mandays (dari Activities)">
                          {getCalculatedMandays(member.userId).toFixed(1)} md
                        </span>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMemberMutation.isPending}
                          className="p-1.5 border border-outline-variant hover:border-error/30 hover:bg-error/5 text-secondary hover:text-error rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Table */}
          {members.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Ringkasan Alokasi Per Role
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant text-secondary text-xs font-bold">
                      <th className="py-2">Role</th>
                      <th className="py-2 text-center font-semibold">Jumlah Member</th>
                      <th className="py-2 text-right">Total Mandays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles
                      .map((role: any) => {
                        const roleMembers = members.filter((m: any) => m.roleId === role.id);
                        if (roleMembers.length === 0) return null;
                        const totalAktual = roleMembers.reduce((sum: number, m: any) => sum + getCalculatedMandays(m.userId), 0);
                        return {
                          id: role.id,
                          name: role.name,
                          count: roleMembers.length,
                          aktual: totalAktual,
                        };
                      })
                      .filter(Boolean)
                      .map((item: any) => (
                        <tr key={item.id} className="border-b border-outline-variant/40 hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-2 font-medium text-on-background">{item.name}</td>
                          <td className="py-2 text-center text-secondary font-mono">{item.count} orang</td>
                          <td className="py-2 text-right text-primary font-mono font-semibold">{item.aktual.toFixed(1)} md</td>
                        </tr>
                      ))}
                    <tr className="font-bold text-on-background bg-surface-container-high/20">
                      <td className="py-3">Grand Total</td>
                      <td className="py-3 text-center font-mono">
                        {Array.from(new Set(members.map((m: any) => m.userId))).length} orang
                      </td>
                      <td className="py-3 text-right text-primary font-mono">
                        {Array.from(new Set(members.map((m: any) => m.userId)))
                          .reduce((sum: number, userId: any) => sum + getCalculatedMandays(userId), 0)
                          .toFixed(1)} md
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
