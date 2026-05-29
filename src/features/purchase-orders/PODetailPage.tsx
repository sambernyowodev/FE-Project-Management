import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  Plus,
  AlertCircle,
  FileText,
  PieChart,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  useGetPurchaseOrder,
  useGetProjectsWithoutPO,
  useAddProjectToPO,
  useRemoveProjectFromPO
} from '@/modules/purchase-orders/hooks/usePurchaseOrders';

export function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const poId = Number(id);

  const { data: po, isLoading: isPoLoading, refetch } = useGetPurchaseOrder(poId);
  const { data: projectsWithoutPo = [], isLoading: isProjectsLoading } = useGetProjectsWithoutPO();

  const addProjectMutation = useAddProjectToPO();
  const removeProjectMutation = useRemoveProjectFromPO();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isPoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="ml-3 text-secondary">Loading PO details...</span>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <h2 className="text-xl font-bold text-on-background">Purchase Order Not Found</h2>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold"
        >
          Back to List
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }

    const selectedProj = projectsWithoutPo.find((p: any) => p.id === Number(selectedProjectId));
    if (!selectedProj) {
      alert('Selected project not found');
      return;
    }

    try {
      await addProjectMutation.mutateAsync({
        poId,
        data: {
          projectId: Number(selectedProjectId),
          allocatedMandays: Number(selectedProj.totalMandays || 0),
          remarks: remarks || undefined
        }
      });
      setSelectedProjectId('');
      setSearchQuery('');
      setRemarks('');
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to assign project');
    }
  };

  const handleRemoveProject = async (projectId: number, projectName: string) => {
    if (window.confirm(`Are you sure you want to remove project "${projectName}" from this PO?`)) {
      try {
        await removeProjectMutation.mutateAsync({ poId, projectId });
        refetch();
      } catch (err: any) {
        alert(err?.response?.data?.message || err.message || 'Failed to remove project');
      }
    }
  };

  const pctUsed = po.totalMandays > 0 ? (po.allocatedMandays / po.totalMandays) * 100 : 0;
  const progressColor = po.remainingMandays < 0 ? 'bg-error' : pctUsed > 90 ? 'bg-warning' : 'bg-success';

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <button
          type="button"
          onClick={() => navigate('/purchase-orders')}
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="font-mono text-xs px-2 py-1 bg-surface-container-high rounded text-secondary border border-outline-variant">{po.poNumber}</span>
          <h1 className="text-3xl font-bold text-on-background mt-1 mb-1">{po.poName}</h1>
          <p className="text-secondary text-sm">Customer: <span className="font-semibold text-on-background">{po.customer}</span></p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary font-medium">Total Value</p>
            <p className="text-lg font-bold text-on-background">{formatCurrency(po.totalAmount)}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <PieChart className="w-6 h-6" />
          </div>
          <div className="w-full">
            <p className="text-xs text-secondary font-medium">Total Mandays</p>
            <p className="text-lg font-bold text-on-background">{po.totalMandays}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-secondary/15 rounded-lg text-secondary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary font-medium">Allocated Mandays</p>
            <p className="text-lg font-bold text-on-background">{(po as any).allocatedMandays ?? 0}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-lg ${po.remainingMandays < 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary font-medium">Remaining Mandays</p>
            <p className={`text-lg font-bold ${po.remainingMandays < 0 ? 'text-error' : 'text-success'}`}>{po.remainingMandays}</p>
          </div>
        </div>
      </div>

      {/* Progress & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Projects Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h2 className="text-lg font-bold text-on-background flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>Assigned Projects</span>
              </h2>
              <span className="text-xs text-secondary font-medium">{po.poProjects?.length || 0} Project(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-outline-variant text-secondary font-medium">
                    <th className="py-2.5">Project Name</th>
                    <th className="py-2.5 text-center">Allocated Mandays</th>
                    <th className="py-2.5">Remarks</th>
                    <th className="py-2.5 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {po.poProjects && po.poProjects.length > 0 ? (
                    po.poProjects.map((item: any) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="py-3">
                          <Link to={`/projects/${item.projectId}`} className="font-semibold text-primary hover:underline">
                            {item.project?.project?.name || `Project #${item.projectId}`}
                          </Link>
                        </td>
                        <td className="py-3 text-center font-medium">{item.allocatedMandays}</td>
                        <td className="py-3 text-secondary text-xs">{item.remarks || '-'}</td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(item.projectId, item.project?.project?.name || `Project #${item.projectId}`)}
                            className="p-1.5 hover:bg-error/10 text-secondary hover:text-error rounded transition-colors cursor-pointer"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-secondary">
                        No projects assigned to this PO yet. Use the sidebar form to assign a project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Assign Project Form & Details */}
        <div className="flex flex-col gap-6">
          {/* Assign Project Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-on-background border-b border-outline-variant pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Assign Project</span>
            </h2>

            <form onSubmit={handleAssignProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-semibold text-secondary">Select Project *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isProjectsLoading ? "Loading projects..." : "-- Choose Project --"}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setSelectedProjectId('');
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-8"
                    disabled={isProjectsLoading || projectsWithoutPo.length === 0}
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-on-background cursor-pointer"
                    disabled={isProjectsLoading || projectsWithoutPo.length === 0}
                  >
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isDropdownOpen && "rotate-180")} />
                  </button>
                </div>

                {/* Dropdown Items List */}
                {isDropdownOpen && !isProjectsLoading && projectsWithoutPo.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                    {projectsWithoutPo
                      .filter((p: any) =>
                        (p.project?.name || `Project #${p.id}`)
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                      .map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProjectId(String(p.id));
                            setSearchQuery(p.project?.name || `Project #${p.id}`);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "px-3 py-2 text-sm text-on-background hover:bg-surface-container-high cursor-pointer transition-colors flex justify-between items-center",
                            selectedProjectId === String(p.id) && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <span>{p.project?.name || `Project #${p.id}`}</span>
                          <span className="text-xs text-secondary font-medium bg-surface-container px-1.5 py-0.5 rounded">{p.totalMandays || 0} md</span>
                        </div>
                      ))}
                    {projectsWithoutPo.filter((p: any) =>
                      (p.project?.name || `Project #${p.id}`)
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                        <div className="px-3 py-2 text-xs text-secondary text-center">No projects match your search</div>
                      )}
                  </div>
                )}

                {projectsWithoutPo.length === 0 && !isProjectsLoading && (
                  <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>No unassigned active projects available.</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">Remarks</label>
                <textarea
                  placeholder="Optional notes..."
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-background text-on-background resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={addProjectMutation.isPending || !selectedProjectId}
                className="w-full py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{addProjectMutation.isPending ? 'Assigning...' : 'Assign Project'}</span>
              </button>
            </form>
          </div>

          {/* Details & Dates Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>Details & Duration</span>
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-secondary">Description</p>
                <p className="text-on-background">{po.description || 'No description provided.'}</p>
              </div>

              <div className="border-t border-outline-variant pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Start Date</span>
                  </span>
                  <span className="font-medium text-on-background">{po.startDate ? new Date(po.startDate).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>End Date</span>
                  </span>
                  <span className="font-medium text-on-background">{po.endDate ? new Date(po.endDate).toLocaleDateString('id-ID') : '-'}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="border-t border-outline-variant pt-3">
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-secondary">Mandays Usage</span>
                  <span className={po.remainingMandays < 0 ? 'text-error' : 'text-on-background'}>{pctUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`${progressColor} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, pctUsed)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
