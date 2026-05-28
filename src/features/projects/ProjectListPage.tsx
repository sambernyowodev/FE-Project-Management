import { Plus, Search, Filter } from 'lucide-react';
import { StatusBadge } from '@/shared/components/common/StatusBadge';
import { useGetProjects } from '@/modules/projects/hooks/useProjects';
import { useNavigate } from 'react-router-dom';

export function ProjectListPage() {
  const { data: projects = [], isLoading } = useGetProjects();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Projects</h1>
          <p className="text-secondary text-sm">Manage enterprise projects, timelines, and resources.</p>
        </div>
        <button 
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg bg-surface text-secondary hover:bg-surface-container-low transition-colors text-sm font-semibold w-full sm:w-auto cursor-pointer">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Project Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-secondary">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-secondary">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-secondary">{project.projectCode || `PRJ-${project.id}`}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-on-background">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-secondary">{project.picClient || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-surface-container-high rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `0%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-secondary min-w-[32px]">0%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status || 'PLANNING'} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-primary hover:text-primary/80 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-outline-variant flex items-center justify-between text-sm text-secondary bg-surface-container-lowest">
          <span>Showing 1 to 3 of 3 results</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container-low disabled:opacity-50 cursor-pointer" disabled>Prev</button>
            <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container-low disabled:opacity-50 cursor-pointer" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
