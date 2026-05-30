import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Calculator, 
  Eye, 
  Download, 
  X, 
  Briefcase,
  AlertCircle,
  Search,
  Ticket,
  FileText
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { exportBillingToExcel } from '@/shared/lib/excel';
import { useGetBillings, useGetBillingById } from '@/modules/billing/hooks/useBilling';
import { StatusBadge } from '@/shared/components/common/StatusBadge';

export function BillingHubPage() {
  const navigate = useNavigate();
  
  // Navigation & Listing States
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<'ALL' | 'PROJECT' | 'SUPPORT'>('ALL');

  // Queries
  const { data: billingsList = [], isLoading: isListLoading } = useGetBillings();
  const { data: billingDetailRes, isLoading: isDetailLoading } = useGetBillingById(selectedBillingId!);
  const billingDetail = billingDetailRes;

  // Handlers
  const handleStartCreation = (type: 'PROJECT' | 'SUPPORT') => {
    navigate(`/billing/new?type=${type}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Filter existing billings list
  const filteredBillings = billingsList.filter(b => {
    const matchesSearch = b.billingNumber.toLowerCase().includes(listSearch.toLowerCase()) ||
      (b.remarks && b.remarks.toLowerCase().includes(listSearch.toLowerCase()));
    
    const matchesType = listTypeFilter === 'ALL' || b.billingType === listTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background mb-1">Billing Hub</h1>
          <p className="text-secondary text-sm">Create and track billing support data based on actual project mandays and support ticket logs.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            id="btn-create-project-billing"
            onClick={() => handleStartCreation('PROJECT')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary/95 transition-all text-sm font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            <Briefcase className="w-4 h-4" /> Create Project Billing
          </button>
          <button 
            id="btn-create-support-billing"
            onClick={() => handleStartCreation('SUPPORT')}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 transition-all text-sm font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            <Ticket className="w-4 h-4" /> Create Support Billing
          </button>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        {/* Filters & Search */}
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 border-b md:border-b-0 pb-3 md:pb-0 overflow-x-auto">
            <button 
              onClick={() => setListTypeFilter('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                listTypeFilter === 'ALL' 
                  ? "bg-primary text-on-primary" 
                  : "text-secondary hover:bg-surface-container-low"
              )}
            >
              All Billings
            </button>
            <button 
              onClick={() => setListTypeFilter('PROJECT')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                listTypeFilter === 'PROJECT' 
                  ? "bg-primary text-on-primary" 
                  : "text-secondary hover:bg-surface-container-low"
              )}
            >
              Project Billings
            </button>
            <button 
              onClick={() => setListTypeFilter('SUPPORT')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                listTypeFilter === 'SUPPORT' 
                  ? "bg-primary text-on-primary" 
                  : "text-secondary hover:bg-surface-container-low"
              )}
            >
              Support Billings
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search billing number or remarks..."
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-background text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Billings Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant text-xs font-semibold text-secondary uppercase">
                  <th className="px-5 py-4">Billing No</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4 text-right">Mandays</th>
                  <th className="px-5 py-4 text-right">Total Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isListLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-secondary text-sm">Loading billing records...</td>
                  </tr>
                ) : filteredBillings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-secondary text-sm">No billing records found.</td>
                  </tr>
                ) : (
                  filteredBillings.map((b) => {
                    const isSupport = b.billingType === 'SUPPORT';
                    const startStr = new Date(b.billingPeriodStart).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    const endStr = new Date(b.billingPeriodEnd).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    
                    return (
                      <tr key={b.id} className="hover:bg-surface-container-lowest/50 text-sm transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-primary">{b.billingNumber}</td>
                        <td className="px-5 py-4">
                          {isSupport ? (
                            <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                              SUPPORT
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
                              PROJECT
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-secondary">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {startStr} - {endStr}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-secondary">{Number(b.totalMandays).toFixed(2)}</td>
                        <td className="px-5 py-4 text-right font-bold text-on-background">{formatCurrency(Number(b.totalAmount))}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedBillingId(b.id)}
                              title="View Details"
                              className="p-1.5 border border-outline-variant hover:border-primary text-secondary hover:text-primary rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => exportBillingToExcel(b)}
                              title="Export to Excel"
                              className="p-1.5 border border-outline-variant hover:border-green-600 text-secondary hover:text-green-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- DRILL-DOWN BILLING DETAILS MODAL --- */}
      {selectedBillingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-bold text-on-background text-lg flex items-center gap-2">
                    Billing Details: <span className="font-mono text-primary font-bold">{billingDetail?.billingNumber || '...'}</span>
                  </h3>
                  <p className="text-secondary text-xs">Created on {billingDetail?.createdAt ? new Date(billingDetail.createdAt).toLocaleString('id-ID') : '-'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBillingId(null)}
                className="text-secondary hover:text-on-background transition-colors p-1 hover:bg-surface-container-high rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-secondary text-sm">Loading details...</p>
                </div>
              ) : !billingDetail ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-error">
                  <AlertCircle className="w-10 h-10" />
                  <p className="font-semibold">Billing record details could not be found.</p>
                </div>
              ) : (
                <>
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-container-low/30 border border-outline-variant rounded-xl p-4 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-secondary text-xs">Billing Type</span>
                      <span className="font-semibold text-on-background">
                        {billingDetail.billingType === 'SUPPORT' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">SUPPORT BILLING</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">PROJECT BILLING</span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-secondary text-xs">Billing Period</span>
                      <span className="font-semibold text-on-background">
                        {new Date(billingDetail.billingPeriodStart).toLocaleDateString('id-ID')} - {new Date(billingDetail.billingPeriodEnd).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-secondary text-xs">Total Mandays</span>
                      <span className="font-semibold text-on-background">
                        {Number(billingDetail.totalMandays).toFixed(2)} md
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-secondary text-xs">Status</span>
                      <span>
                        <StatusBadge status={billingDetail.status} />
                      </span>
                    </div>
                    {billingDetail.remarks && (
                      <div className="col-span-1 md:col-span-4 mt-2 pt-2 border-t border-outline-variant flex flex-col gap-0.5">
                        <span className="text-secondary text-xs">Remarks / Notes</span>
                        <p className="text-on-background italic">"{billingDetail.remarks}"</p>
                      </div>
                    )}
                  </div>

                  {/* Details Table */}
                  <div className="border border-outline-variant rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant">
                          <th className="px-4 py-3 font-semibold text-secondary uppercase text-xs">Breakdown Item</th>
                          <th className="px-4 py-3 font-semibold text-secondary uppercase text-xs">Role</th>
                          <th className="px-4 py-3 font-semibold text-secondary uppercase text-xs text-right">Mandays</th>
                          <th className="px-4 py-3 font-semibold text-secondary uppercase text-xs text-right">Rate/Manday</th>
                          <th className="px-4 py-3 font-semibold text-secondary uppercase text-xs text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {(billingDetail.details || []).map((detail: any) => {
                          const isSupport = billingDetail.billingType === 'SUPPORT';
                          const itemName = detail.project?.project?.name || detail.project?.name || 'Unknown Project/Ticket';
                          
                          return (
                            <tr key={detail.id} className="hover:bg-surface-container-lowest/50">
                              <td className="px-4 py-3 font-medium text-on-background max-w-[320px]">
                                <div className="flex flex-col gap-1">
                                  <span className="truncate block" title={itemName}>{itemName}</span>
                                  <div>
                                    {isSupport ? (
                                      <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full inline-block">
                                        Support Activity
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full inline-block">
                                        Project Activity
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-primary">{detail.role?.name || 'Unknown Role'}</td>
                              <td className="px-4 py-3 text-secondary text-right">{Number(detail.mandays).toFixed(2)}</td>
                              <td className="px-4 py-3 text-secondary text-right">{formatCurrency(Number(detail.ratePerManday))}</td>
                              <td className="px-4 py-3 font-bold text-on-background text-right">{formatCurrency(Number(detail.subtotal))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-surface-container-low font-bold border-t border-outline-variant">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right">Subtotal</td>
                          <td className="px-4 py-3 text-right">{Number(billingDetail.totalMandays).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-primary">{formatCurrency(Number(billingDetail.totalAmount))}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-4 py-2.5 text-right text-secondary text-xs">Estimated Tax (11%)</td>
                          <td className="px-4 py-2.5 text-right text-error text-xs">{formatCurrency(Number(billingDetail.totalAmount) * 0.11)}</td>
                        </tr>
                        <tr className="text-base border-t border-outline">
                          <td colSpan={4} className="px-4 py-3 text-right">Grand Total</td>
                          <td className="px-4 py-3 text-right text-green-700 font-bold">{formatCurrency(Number(billingDetail.totalAmount) * 1.11)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button 
                onClick={() => setSelectedBillingId(null)}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-secondary hover:text-on-background transition-colors text-sm font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
              {billingDetail && (
                <button 
                  onClick={() => exportBillingToExcel(billingDetail)}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white transition-colors text-sm font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Export Excel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
