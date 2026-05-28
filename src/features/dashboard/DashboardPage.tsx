import { 
  FolderKanban, 
  CalendarDays, 
  Bug, 
  Clock, 
  MoreVertical 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

import { useMemo } from 'react';
import { useGetProjects } from '@/modules/projects/hooks/useProjects';
import { useGetSupportTickets } from '@/modules/support/hooks/useSupportTickets';

export function DashboardPage() {
  const { data: projects = [], isLoading: isProjectsLoading } = useGetProjects();
  const { data: tickets = [], isLoading: isTicketsLoading } = useGetSupportTickets();

  const activeProjects = projects.filter(p => p.isActive).length;
  const totalMandays = 0; // Mandays removed from API
  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const hoursThisMonth = tickets.reduce((acc, t) => acc + (t.hoursSpent || 0), 0);

  const barData = useMemo(() => {
    const statusMap = projects.reduce((acc, p) => {
      const status = p.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1; // Count projects instead of mandays since mandays is removed
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const pieData = useMemo(() => {
    const customerMap = projects.reduce((acc, p) => {
      const customer = p.picClient || 'Unknown';
      acc[customer] = (acc[customer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#0052cc', '#7029e1', '#0c56d0', '#5600be', '#0b1c30'];
    return Object.entries(customerMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [projects]);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1 hidden md:block">Dashboard</h1>
          <h1 className="text-2xl font-bold text-on-background mb-1 md:hidden">Dashboard</h1>
          <p className="text-secondary text-sm">Overview of enterprise project metrics and activity.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded bg-white hover:bg-surface-container-low transition-colors text-on-surface-variant text-xs font-semibold shadow-sm cursor-pointer">
          <CalendarDays className="w-4 h-4" />
          <span>This Month</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-primary-container transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Projects</p>
            <FolderKanban className="text-primary-container bg-surface-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isProjectsLoading ? '...' : activeProjects}</h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-primary-container transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Mandays</p>
            <CalendarDays className="text-secondary bg-surface-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isProjectsLoading ? '...' : totalMandays}</h3>
            <span className="text-[11px] font-medium text-secondary">days</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-error transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-error opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Open Tickets</p>
            <Bug className="text-error bg-error-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isTicketsLoading ? '...' : openTickets}</h3>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-tertiary transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Ticket Hours</p>
            <Clock className="text-tertiary bg-tertiary-fixed p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isTicketsLoading ? '...' : hoursThisMonth}</h3>
            <span className="text-[11px] font-medium text-secondary">hrs</span>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-background">Mandays by Status</h3>
            <button className="text-secondary hover:text-on-background transition-colors cursor-pointer">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737685', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737685', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #c3c6d6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0052cc' : '#dae2fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-background">Projects by Customer</h3>
            <button className="text-secondary hover:text-on-background transition-colors cursor-pointer">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
