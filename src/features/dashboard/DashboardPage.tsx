import {
  FolderKanban,
  CalendarDays,
  Bug,
  DollarSign,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { useMemo, useState } from 'react';
import { useGetProjects } from '@/modules/projects/hooks/useProjects';
import { useGetSupportTickets } from '@/modules/support/hooks/useSupportTickets';
import { useGetBillings } from '@/modules/billing/hooks/useBilling';
import { useGetPurchaseOrders } from '@/modules/purchase-orders/hooks/usePurchaseOrders';

export function DashboardPage() {
  const { data: projectsRes, isLoading: isProjectsLoading } = useGetProjects({ perPage: 1000 });
  const { data: ticketsRes, isLoading: isTicketsLoading } = useGetSupportTickets({ perPage: 1000 });
  const { data: billingsRes, isLoading: isBillingsLoading } = useGetBillings({ perPage: 1000 });
  const { data: posRes } = useGetPurchaseOrders({ perPage: 1000 });

  const projects = projectsRes?.data || [];
  const tickets = ticketsRes?.data || [];
  const billings: any[] = Array.isArray(billingsRes) ? billingsRes : (billingsRes as any)?.data || [];
  const purchaseOrders = posRes?.data || [];

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();

    projects.forEach(p => {
      if (p.startDate) {
        years.add(new Date(p.startDate).getFullYear());
      }
    });

    tickets.forEach(t => {
      if (t.startDate) {
        years.add(new Date(t.startDate).getFullYear());
      }
    });

    const currentYear = new Date().getFullYear();
    years.add(currentYear);

    return Array.from(years).sort((a, b) => b - a);
  }, [projects, tickets]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter data based on selected year
  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.startDate && new Date(p.startDate).getFullYear() === selectedYear);
  }, [projects, selectedYear]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => t.startDate && new Date(t.startDate).getFullYear() === selectedYear);
  }, [tickets, selectedYear]);

  const filteredBillings = useMemo(() => {
    return billings.filter(b => b.billingPeriodStart && new Date(b.billingPeriodStart).getFullYear() === selectedYear);
  }, [billings, selectedYear]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const dateToUse = po.startDate || po.createdAt;
      return dateToUse && new Date(dateToUse).getFullYear() === selectedYear;
    });
  }, [purchaseOrders, selectedYear]);

  // Derived Metrics
  const totalProjects = filteredProjects.length;

  const totalTickets = filteredTickets.length;

  const totalBillingAmount = filteredBillings.reduce((sum, b) => sum + (b.status === 'FINALIZED' ? (b.totalAmount || 0) : 0), 0);

  // Unbilled mandays calculation: Total mandays from projects minus total mandays in finalized billings
  const totalProjectMandays = filteredProjects.reduce((sum, p) => sum + (p.totalMandays || 0), 0);
  const totalBilledMandays = filteredBillings.reduce((sum, b) => sum + (b.status === 'FINALIZED' ? (b.totalMandays || 0) : 0), 0);
  const unbilledMandays = Math.max(0, totalProjectMandays - totalBilledMandays);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const barData = useMemo(() => {
    const statusMap = filteredProjects.reduce((acc, p) => {
      const status = p.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const pieData = useMemo(() => {
    const customerMap = filteredProjects.reduce((acc, p) => {
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
  }, [filteredProjects]);

  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProjects = new Array(12).fill(0);

    filteredProjects.forEach(p => {
      if (p.startDate) {
        const monthIndex = new Date(p.startDate).getMonth();
        monthlyProjects[monthIndex] += 1;
      }
    });

    return months.map((month, index) => ({
      month,
      count: monthlyProjects[index]
    }));
  }, [filteredProjects]);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1 hidden md:block">Dashboard</h1>
          <h1 className="text-2xl font-bold text-on-background mb-1 md:hidden">Dashboard</h1>
          <p className="text-secondary text-sm">Overview of enterprise project metrics, billing, and support.</p>
        </div>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded bg-white hover:bg-surface-container-low transition-colors text-on-surface-variant text-sm font-semibold shadow-sm cursor-pointer appearance-none pr-8 outline-none focus:border-primary"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-primary-container transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Projects</p>
            <FolderKanban className="text-primary-container bg-surface-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isProjectsLoading ? '...' : totalProjects}</h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-secondary transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Billing</p>
            <DollarSign className="text-secondary bg-secondary-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-bold text-on-background truncate" title={formatCurrency(totalBillingAmount)}>
              {isBillingsLoading ? '...' : formatCurrency(totalBillingAmount)}
            </h3>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-error transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-error opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Supports</p>
            <Bug className="text-error bg-error-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isTicketsLoading ? '...' : totalTickets}</h3>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-tertiary transition-colors duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Unbilled Mandays</p>
            <CalendarDays className="text-tertiary bg-tertiary-container p-1.5 rounded-md w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-on-background">{isProjectsLoading || isBillingsLoading ? '...' : unbilledMandays}</h3>
            <span className="text-[11px] font-medium text-secondary">days</span>
          </div>
        </div>
      </div>

      {/* Trend Chart Area */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-on-background">Project Trend ({selectedYear})</h3>
        </div>
        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e4f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#737685', fontSize: 12 }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737685', fontSize: 12 }}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #c3c6d6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [value, 'Projects']}
              />
              <Line type="monotone" dataKey="count" stroke="#0052cc" strokeWidth={3} dot={{ r: 4, fill: '#0052cc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-background">Projects by Status</h3>
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

      {/* Information PO & Billing Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Purchase Orders Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-on-background">Purchase Orders ({selectedYear})</h3>
          </div>
          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-secondary uppercase bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold">PO Number</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.slice(0, 5).map(po => (
                  <tr key={po.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors">
                    <td className="px-4 py-3 font-medium text-on-background">{po.poNumber}</td>
                    <td className="px-4 py-3">{po.customer}</td>
                    <td className="px-4 py-3">{formatCurrency(po.totalAmount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${po.status === 'ACTIVE' ? 'bg-primary-container text-primary' :
                          po.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                            'bg-surface-container text-on-surface'
                        }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-secondary">
                      No Purchase Orders found for {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Billings Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-on-background">Billings ({selectedYear})</h3>
          </div>
          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-secondary uppercase bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold">Billing Number</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBillings.slice(0, 5).map(billing => (
                  <tr key={billing.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors">
                    <td className="px-4 py-3 font-medium text-on-background">{billing.billingNumber}</td>
                    <td className="px-4 py-3">{billing.billingType}</td>
                    <td className="px-4 py-3">{formatCurrency(billing.totalAmount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${billing.status === 'FINALIZED' ? 'bg-green-50 text-green-700' :
                          'bg-surface-container text-on-surface'
                        }`}>
                        {billing.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredBillings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-secondary">
                      No Billings found for {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
