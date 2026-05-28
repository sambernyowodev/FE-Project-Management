import { Users, AlertCircle, CheckCircle2, UserCheck, Settings } from 'lucide-react';
import type { ProjectMember, ProjectActivity } from '@/modules/projects/types';

interface ResourcePanelProps {
  members: ProjectMember[];
  activities: ProjectActivity[];
  onManageTeam?: () => void;
}

const ROLE_MAPPINGS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  PM: { label: 'Project Manager', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  TL: { label: 'Tech Lead', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  BA: { label: 'Business Analyst', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  UIUX: { label: 'UI/UX Designer', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  DEV_BE: { label: 'Backend Developer', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  DEV_FE: { label: 'Frontend Developer', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  QC: { label: 'Quality Control', color: 'bg-pink-100 text-pink-700 border-pink-200' }
};

export function ResourcePanel({ members = [], activities = [], onManageTeam }: ResourcePanelProps) {
  // Count tasks per user ID
  const taskCounts: Record<number, number> = {};
  activities.forEach(act => {
    if (act.assignedToId) {
      taskCounts[act.assignedToId] = (taskCounts[act.assignedToId] || 0) + 1;
    }
  });

  // Group members by role code (using role.code)
  const groupedMembers: Record<string, ProjectMember[]> = {
    PM: [],
    TL: [],
    BA: [],
    UIUX: [],
    DEV_BE: [],
    DEV_FE: [],
    QC: []
  };

  // Keep track of members that don't fit the standard roles
  const otherMembers: ProjectMember[] = [];

  members.forEach(member => {
    const roleCode = member.role?.code;
    if (roleCode && roleCode in groupedMembers) {
      groupedMembers[roleCode].push(member);
    } else {
      otherMembers.push(member);
    }
  });

  const totalResources = members.length;
  const activeResources = members.filter(m => (taskCounts[m.userId] || 0) > 0).length;
  const underAllocated = totalResources - activeResources;

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  // Avatar colors based on user ID to keep it consistent
  const getAvatarBg = (id: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-sky-600 font-semibold'
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Title Header */}
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-on-background">Resource Allocation</h3>
        </div>
        <div className="flex items-center gap-2">
          {onManageTeam && (
            <button
              onClick={onManageTeam}
              className="p-1 hover:bg-surface-container-high rounded-lg text-primary hover:text-primary/80 transition-colors cursor-pointer"
              title="Kelola Team Member"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            {totalResources} Orang
          </span>
        </div>
      </div>

      {/* Allocation Summary cards */}
      <div className="p-4 grid grid-cols-3 gap-2 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface border border-outline-variant text-center">
          <span className="text-lg font-bold text-primary">{totalResources}</span>
          <span className="text-[10px] text-secondary font-medium">Total Team</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface border border-outline-variant text-center">
          <span className="text-lg font-bold text-emerald-600 flex items-center gap-1">
            <UserCheck className="w-4 h-4 inline-block" />
            {activeResources}
          </span>
          <span className="text-[10px] text-secondary font-medium">Active</span>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface border border-outline-variant text-center">
          <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 inline-block" />
            {underAllocated}
          </span>
          <span className="text-[10px] text-secondary font-medium">Idle</span>
        </div>
      </div>

      {/* Resource List grouped by roles */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {Object.entries(groupedMembers).map(([roleCode, roleMembers]) => {
          if (roleMembers.length === 0) return null;
          const roleMapping = ROLE_MAPPINGS[roleCode];
          
          return (
            <div key={roleCode} className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
                <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${roleMapping?.color || 'bg-slate-100 text-slate-700'}`}>
                  {roleMapping?.label || roleCode}
                </span>
                <span className="text-xs text-secondary font-medium">{roleMembers.length} Person</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {roleMembers.map(member => {
                  const tasks = taskCounts[member.userId] || 0;
                  const userName = member.user?.fullName || `User ID: ${member.userId}`;
                  const userEmail = member.user?.email || '';
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-surface-container-low/50 border border-outline-variant/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarBg(member.userId)} text-white text-xs font-bold flex items-center justify-center shadow-inner shrink-0`}>
                          {getInitials(userName)}
                        </div>
                        {/* Details */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-on-background truncate">{userName}</span>
                          <span className="text-[10px] text-secondary truncate">{userEmail}</span>
                        </div>
                      </div>
                      
                      {/* Task Count Badge */}
                      <div className="shrink-0 pl-2">
                        {tasks > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {tasks} Task
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Idle
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Other Members (Unmapped roles) */}
        {otherMembers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5">
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Other Resources
              </span>
              <span className="text-xs text-secondary font-medium">{otherMembers.length} Person</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {otherMembers.map(member => {
                const tasks = taskCounts[member.userId] || 0;
                const userName = member.user?.fullName || `User ID: ${member.userId}`;
                const roleName = member.role?.name || 'Resource';
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-surface-container-low/50 border border-outline-variant/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarBg(member.userId)} text-white text-xs font-bold flex items-center justify-center shadow-inner shrink-0`}>
                        {getInitials(userName)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-on-background truncate">{userName}</span>
                        <span className="text-[10px] text-secondary truncate">{roleName}</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 pl-2">
                      {tasks > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {tasks} Task
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Idle
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-secondary border-2 border-dashed border-outline-variant rounded-xl p-6">
            <Users className="w-10 h-10 text-secondary/40 mb-3" />
            <p className="text-sm font-semibold">Belum Ada Resource</p>
            <p className="text-xs mt-1 max-w-[200px]">Project ini belum memiliki member yang dialokasikan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
