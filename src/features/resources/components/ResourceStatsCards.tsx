import { Users, CheckCircle2, AlertCircle, TicketCheck, FolderKanban } from 'lucide-react';
import type { ResourceMember } from '@/modules/resources/types';

interface ResourceStatsCardsProps {
  resources: ResourceMember[];
}

export function ResourceStatsCards({ resources = [] }: ResourceStatsCardsProps) {
  const totalResources = resources.length;
  const totalIdle = resources.filter(r => r.isIdle).length;
  const totalInProject = resources.filter(r => r.activeProjectCount > 0).length;
  const totalInSupport = resources.filter(r => r.activeSupportCount > 0).length;
  const totalBusy = resources.filter(r => !r.isIdle).length;

  const totalActiveProjects = resources.reduce((sum, r) => sum + r.activeProjectCount, 0);
  const totalActiveSupports = resources.reduce((sum, r) => sum + r.activeSupportCount, 0);

  const utilizationRate = totalResources > 0 ? Math.round((totalBusy / totalResources) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Team */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Anggota Project</span>
          <span className="text-2xl font-black text-on-background mt-1">{totalResources}</span>
          <span className="text-[11px] text-secondary mt-0.5 font-medium">Terdaftar dalam sistem</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Resource Idle */}
      <div className="bg-surface-container-lowest border border-emerald-500/30 rounded-xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Anggota Idle (Tersedia)
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">{totalIdle}</span>
          <span className="text-[11px] text-secondary mt-0.5 font-medium">Siap dialokasikan ke project baru</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Resource Busy / In Project & Support */}
      <div className="bg-surface-container-lowest border border-amber-500/30 rounded-xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Anggota Sedang Bertugas
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">{totalBusy}</span>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary font-medium">
            <span>{totalInProject} di Project</span>
            <span>•</span>
            <span>{totalInSupport} di Support</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Active Workload Breakdown */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">Tingkat Utilisasi Tim</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-primary">{utilizationRate}%</span>
            <span className="text-xs text-secondary font-semibold">({totalBusy}/{totalResources})</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary font-medium">
            <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3 text-primary" /> {totalActiveProjects} Active PRJ</span>
            <span>•</span>
            <span className="flex items-center gap-1"><TicketCheck className="w-3 h-3 text-purple-600" /> {totalActiveSupports} Active SUP</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
          <TicketCheck className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
