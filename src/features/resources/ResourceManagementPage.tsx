import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  TicketCheck,
  Eye,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGetResourceManagement } from '@/modules/resources/hooks/useResources';
import { ResourceStatsCards } from './components/ResourceStatsCards';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import type { ResourceMember } from '@/modules/resources/types';

export function ResourceManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'idle' | 'busy' | 'project' | 'support'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'workload' | 'employeeId'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query resources
  const { data: resources = [], isLoading, refetch, isFetching } = useGetResourceManagement({
    search,
    status: statusFilter,
    sortBy,
  });

  // Reset page when filter/search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: 'all' | 'idle' | 'busy' | 'project' | 'support') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSortByChange = (sort: 'name' | 'workload' | 'employeeId') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = resources.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResources = resources.slice(startIndex, startIndex + itemsPerPage);

  // Modal detail state
  const [selectedResource, setSelectedResource] = useState<ResourceMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = (resource: ResourceMember) => {
    setSelectedResource(resource);
    setIsDetailOpen(true);
  };

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
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-on-background">Manajemen Anggota Project</h1>
          </div>
          <p className="text-secondary text-sm mt-1">
            Monitoring utilisasi anggota team project, pemetaan project aktif & tiket support yang dipegang, serta status ketersediaan (Idle).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 border border-outline-variant bg-surface rounded-lg hover:bg-surface-container-low text-secondary hover:text-on-background transition-all text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/master/members')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-xs font-bold shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kelola Master Member</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <ResourceStatsCards resources={resources} />

      {/* Toolbar (Search & Filter Status) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Cari nama, NIP, project, support..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-outline-variant rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-secondary mr-1">Status:</span>

          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'all'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-outline-variant text-secondary hover:bg-surface-container-low'
              }`}
          >
            Semua ({resources.length})
          </button>

          <button
            onClick={() => handleStatusFilterChange('idle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'idle'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Idle (Tersedia)</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('busy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'busy'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ada Pekerjaan (Sibuk)</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('project')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'project'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20'
              }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Per Project</span>
          </button>

          <button
            onClick={() => handleStatusFilterChange('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'support'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20'
              }`}
          >
            <TicketCheck className="w-3.5 h-3.5" />
            <span>Per Support</span>
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-bold text-secondary">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-outline-variant rounded-lg bg-surface font-semibold text-on-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="name">Nama (A-Z)</option>
              <option value="workload">Pekerjaan Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resource Table List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Memuat data alokasi anggota project...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-16 text-center text-secondary flex flex-col items-center justify-center gap-2">
            <Users className="w-10 h-10 text-secondary/40" />
            <span className="font-bold text-sm text-on-background">Tidak Ada Anggota Project Ditemukan</span>
            <span className="text-xs">Coba sesuaikan kata kunci pencarian atau filter status.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-secondary font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama</th>
                    <th className="py-3.5 px-4">Role Utama</th>
                    <th className="py-3.5 px-4">Status Pekerjaan</th>
                    <th className="py-3.5 px-4">Project Aktif</th>
                    <th className="py-3.5 px-4">Support Aktif</th>
                    <th className="py-3.5 px-4 text-center">Riwayat Project/Support</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {paginatedResources.map((resource) => (
                    <tr
                      key={resource.id}
                      className="hover:bg-surface-container-low/50 transition-colors group"
                    >
                      {/* Member Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarBg(resource.id)} text-white font-bold text-xs flex items-center justify-center shadow-inner shrink-0`}>
                            {getInitials(resource.fullName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-on-background truncate text-sm">
                                {resource.fullName}
                              </span>
                              {!resource.isActive && (
                                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded text-[9px] font-semibold">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-secondary font-mono truncate">
                              {resource.employeeId} • {resource.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 font-semibold text-secondary">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-container-high border border-outline-variant text-[11px] text-on-background font-medium">
                          {resource.primaryRole}
                        </span>
                      </td>

                      {/* Workload Status Badge */}
                      <td className="py-3.5 px-4">
                        {resource.isIdle ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Idle (Tersedia)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            {resource.workloadLabel}
                          </span>
                        )}
                      </td>

                      {/* Active Projects */}
                      <td className="py-3.5 px-4">
                        {resource.activeProjects.length === 0 ? (
                          <span className="text-secondary/60 italic text-[11px]">- Tidak ada -</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 max-w-xs">
                            {resource.activeProjects.map((p) => (
                              <div
                                key={p.id}
                                className="p-1.5 rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-mono font-bold text-primary shrink-0">{p.projectCode}</span>
                                  <span className="text-on-background font-medium truncate">{p.projectName}</span>
                                </div>
                                <span className="text-[10px] text-secondary font-mono shrink-0">
                                  {p.progressPct || 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Active Supports */}
                      <td className="py-3.5 px-4">
                        {resource.activeSupports.length === 0 ? (
                          <span className="text-secondary/60 italic text-[11px]">- Tidak ada -</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 max-w-xs">
                            {resource.activeSupports.map((s) => (
                              <div
                                key={s.id}
                                className="p-1.5 rounded-lg bg-surface border border-purple-500/20 flex items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-mono font-bold text-purple-600 shrink-0">{s.ticketCode}</span>
                                  <span className="text-on-background font-medium truncate">{s.issueTitle}</span>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 font-bold shrink-0">
                                  {s.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Completed History */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-on-background font-mono text-sm">
                            {resource.completedProjectCount + resource.completedSupportCount}
                          </span>
                          <span className="text-[10px] text-secondary font-medium">
                            {resource.completedProjectCount} PRJ • {resource.completedSupportCount} SUP
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(resource)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary/40 hover:bg-surface-container-low text-primary rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalItems > 0 && (
              <div className="px-5 py-4 border-t border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-secondary">
                  Menampilkan <span className="font-semibold text-on-background">{startIndex + 1}</span> -{' '}
                  <span className="font-semibold text-on-background">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
                  <span className="font-semibold text-on-background">{totalItems}</span> Anggota Project
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 5) return true;
                        return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
                      })
                      .reduce<(number | string)[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, index) =>
                        typeof item === 'number' ? (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-colors cursor-pointer ${item === currentPage
                              ? 'bg-primary text-on-primary font-bold'
                              : 'text-secondary hover:bg-surface-container-low hover:text-on-background'
                              }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={`dots-${index}`} className="px-1 text-xs text-secondary font-bold">
                            ...
                          </span>
                        )
                      )}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-outline-variant text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Breakdown Modal */}
      <ResourceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
}
