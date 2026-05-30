import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  CalendarDays, 
  Calculator, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Check, 
  Search, 
  Ticket, 
  X
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { exportBillingToExcel } from '@/shared/lib/excel';
import { useGetProjects } from '@/modules/projects/hooks/useProjects';
import { useGetSupportTickets } from '@/modules/support/hooks/useSupportTickets';
import { useGetBillingPreview, useCreateBilling } from '@/modules/billing/hooks/useBilling';
import { StatusBadge } from '@/shared/components/common/StatusBadge';

const steps = [
  { id: 1, name: 'Set Period & Remarks', icon: CalendarDays },
  { id: 2, name: 'Select Billing Items', icon: Building2 },
  { id: 3, name: 'Preview', icon: Calculator },
  { id: 4, name: 'Complete', icon: CheckCircle2 }
];

export function BillingFormPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial values from query params
  const initialType = (searchParams.get('type') as 'PROJECT' | 'SUPPORT') || 'PROJECT';

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const billingType = initialType;

  // Set default dates dynamically (start of current year and today)
  const now = new Date();
  const currentYear = now.getFullYear();
  const localToday = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const localStartOfYear = `${currentYear}-01-01`;

  const [startDate, setStartDate] = useState<string>(localStartOfYear);
  const [endDate, setEndDate] = useState<string>(localToday);
  const [remarks, setRemarks] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(11);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [createdBilling, setCreatedBilling] = useState<any>(null);

  // Search filters
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState<string>('');

  // Queries
  const { data: projectsRes, isLoading: isProjectsLoading } = useGetProjects({ perPage: 1000 });
  const projects = projectsRes?.data || [];

  const { data: ticketsRes, isLoading: isTicketsLoading } = useGetSupportTickets({ perPage: 100 });
  const tickets = ticketsRes?.data || [];

  // Filter projects by selected period (projects starting in the period)
  const filteredProjects = projects.filter(project => {
    if (!project.startDate) return false;
    const projectStart = new Date(project.startDate);
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    return projectStart >= rangeStart && projectStart <= rangeEnd;
  });

  // Filter support tickets by selected period
  const filteredTickets = tickets.filter(ticket => {
    if (!ticket.startDate || !ticket.endDate) return true;
    const ticketStart = new Date(ticket.startDate);
    const ticketEnd = new Date(ticket.endDate);
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    return (
      (ticketStart >= rangeStart && ticketStart <= rangeEnd) ||
      (ticketEnd >= rangeStart && ticketEnd <= rangeEnd) ||
      (ticketStart <= rangeStart && ticketEnd >= rangeEnd)
    );
  });

  // Preview Query
  const { data: previewRes, isLoading: isPreviewLoading } = useGetBillingPreview({
    billingType,
    projectIds: billingType === 'PROJECT' ? selectedProjects : [],
    supportTicketIds: billingType === 'SUPPORT' ? selectedTickets : [],
    startDate,
    endDate,
    remarks
  }, currentStep === 3 && (
    (billingType === 'PROJECT' && selectedProjects.length > 0) ||
    (billingType === 'SUPPORT' && selectedTickets.length > 0)
  ));

  const previewData = previewRes?.data !== undefined ? previewRes.data : previewRes;
  const breakdownData = previewData?.roleBreakdown || [];

  const createBillingMutation = useCreateBilling();

  // Handlers
  const handleToggleProject = (id: number) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleToggleTicket = (id: number) => {
    setSelectedTickets(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleCancelCreation = () => {
    navigate('/billing');
  };

  const handleGenerateBilling = () => {
    createBillingMutation.mutate({
      billingType,
      projectIds: billingType === 'PROJECT' ? selectedProjects : [],
      supportTicketIds: billingType === 'SUPPORT' ? selectedTickets : [],
      startDate,
      endDate,
      remarks
    }, {
      onSuccess: (res) => {
        setCreatedBilling(res);
        setCurrentStep(4);
        queryClient.invalidateQueries({ queryKey: ['billing', 'list'] });
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const subtotal = previewData?.totalAmount || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  // Filter projects by search
  const searchedProjects = filteredProjects.filter(p => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.projectCode && p.projectCode.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  // Filter tickets by search
  const searchedTickets = filteredTickets.filter(t => 
    t.issueTitle.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    (t.ticketCode && t.ticketCode.toLowerCase().includes(ticketSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Create Billing Document</h1>
        <p className="text-secondary text-sm">Generate actual billing summaries for project mandays or support logs.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Stepper Header */}
        <div className="border-b border-outline-variant p-6 bg-surface-container-low/50">
          <div className="flex justify-between items-center mb-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              New {billingType === 'PROJECT' ? 'Project' : 'Support'} Billing Creation
            </span>
            <button 
              onClick={handleCancelCreation}
              className="text-secondary hover:text-on-background transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel & Back
            </button>
          </div>
          
          <div className="flex items-center justify-between relative max-w-3xl mx-auto mt-2">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-outline-variant -translate-y-1/2 z-0 hidden sm:block"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 hidden sm:block transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                    isActive ? "bg-primary text-on-primary border-primary" : 
                    isCompleted ? "bg-primary text-on-primary border-primary" : 
                    "bg-surface-container-lowest text-secondary border-outline-variant"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-semibold hidden sm:block absolute -bottom-6 whitespace-nowrap",
                    isActive || isCompleted ? "text-primary" : "text-secondary"
                  )}>{step.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stepper Body */}
        <div className="p-6 min-h-[400px]">
          {/* STEP 1: Set Period & Remarks */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 max-w-xl mx-auto animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-on-background text-center mb-2">Set Billing Period & Remarks</h2>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-on-background">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-on-background">End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-background">Remarks / Notes</label>
                  <textarea 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)} 
                    placeholder="Enter any additional remarks or invoice notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-background text-on-background" 
                  />
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-sm font-semibold text-on-background">Estimated Tax Rate (%)</label>
                  <input 
                    type="number" 
                    value={taxRate} 
                    onChange={e => setTaxRate(Number(e.target.value))} 
                    className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-on-background" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Select Items */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-on-background">
                  Select {billingType === 'PROJECT' ? 'Projects' : 'Support Tickets'} to Bill
                </h2>
                <p className="text-xs text-secondary mt-1">
                  Billing Period: <span className="font-semibold text-primary">{new Date(startDate).toLocaleDateString('id-ID')}</span> to <span className="font-semibold text-primary">{new Date(endDate).toLocaleDateString('id-ID')}</span>
                </p>
              </div>

              {billingType === 'PROJECT' ? (
                // Flow Project Billing
                <div className="flex flex-col gap-4 border border-outline-variant rounded-xl p-5 bg-surface-container-low/30">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="font-bold text-on-background flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span>Projects ({selectedProjects.length} selected)</span>
                    </h3>
                    
                    {searchedProjects.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <button 
                          type="button"
                          onClick={() => {
                            const allIds = searchedProjects.map(p => p.id);
                            setSelectedProjects(prev => Array.from(new Set([...prev, ...allIds])));
                          }}
                          className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-outline-variant">|</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const allIds = searchedProjects.map(p => p.id);
                            setSelectedProjects(prev => prev.filter(id => !allIds.includes(id)));
                          }}
                          className="text-secondary hover:underline font-semibold cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search active projects..."
                      value={projectSearch}
                      onChange={e => setProjectSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-background text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {isProjectsLoading ? (
                      <p className="text-secondary text-xs text-center py-8 col-span-2">Loading projects...</p>
                    ) : searchedProjects.length === 0 ? (
                      <p className="text-secondary text-xs text-center py-8 col-span-2">No projects match your search in this period.</p>
                    ) : (
                      searchedProjects.map(project => {
                        const isSelected = selectedProjects.includes(project.id);
                        const startDateStr = project.startDate ? new Date(project.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '';
                        const endDateStr = project.endDate ? new Date(project.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '';
                        const dateRangeText = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : startDateStr || '';

                        return (
                          <div 
                            key={project.id}
                            onClick={() => handleToggleProject(project.id)}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-container-low select-none relative flex justify-between items-center gap-3",
                              isSelected 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-outline-variant bg-surface-container-lowest"
                            )}
                          >
                            <div className="flex flex-col gap-1 pr-4 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-secondary bg-surface-container-high px-1.5 py-0.5 rounded truncate">
                                  {project.projectCode || `PRJ-${project.id}`}
                                </span>
                                {project.parentProjectId && (
                                  <span className="text-[8px] bg-secondary-container text-on-secondary-container px-1 rounded font-semibold uppercase">
                                    Support
                                  </span>
                                )}
                                {dateRangeText && (
                                  <span className="text-[9px] text-secondary font-medium">
                                    {dateRangeText}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-on-background text-sm truncate">{project.name}</h4>
                              <p className="text-xxs text-secondary">Client PIC: {project.picClient || '-'}</p>
                            </div>
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                              isSelected ? "bg-primary border-primary text-on-primary" : "border-outline"
                            )}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // Flow Support Ticket Billing
                <div className="flex flex-col gap-4 border border-outline-variant rounded-xl p-5 bg-surface-container-low/30">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="font-bold text-on-background flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      <span>Support Tickets ({selectedTickets.length} selected)</span>
                    </h3>
                    
                    {searchedTickets.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <button 
                          type="button"
                          onClick={() => {
                            const allIds = searchedTickets.map(t => t.id);
                            setSelectedTickets(prev => Array.from(new Set([...prev, ...allIds])));
                          }}
                          className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-outline-variant">|</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const allIds = searchedTickets.map(t => t.id);
                            setSelectedTickets(prev => prev.filter(id => !allIds.includes(id)));
                          }}
                          className="text-secondary hover:underline font-semibold cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search support tickets..."
                      value={ticketSearch}
                      onChange={e => setTicketSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm bg-background text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {isTicketsLoading ? (
                      <p className="text-secondary text-xs text-center py-8 col-span-2">Loading support tickets...</p>
                    ) : searchedTickets.length === 0 ? (
                      <p className="text-secondary text-xs text-center py-8 col-span-2">No support tickets found for this period.</p>
                    ) : (
                      searchedTickets.map(ticket => {
                        const isSelected = selectedTickets.includes(ticket.id);
                        const ticketMandays = Number(ticket.hoursSpent || 0) / 8;
                        const assigneesText = (ticket.assignees || [])
                          .map((a: any) => a.user?.fullName)
                          .filter(Boolean)
                          .join(', ') || '-';
                        const startDateStr = ticket.startDate ? new Date(ticket.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '';
                        const endDateStr = ticket.endDate ? new Date(ticket.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '';
                        const dateRangeText = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : '';
                        
                        return (
                          <div 
                            key={ticket.id}
                            onClick={() => handleToggleTicket(ticket.id)}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-container-low select-none relative flex justify-between items-center gap-3",
                              isSelected 
                                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                : "border-outline-variant bg-surface-container-lowest"
                            )}
                          >
                            <div className="flex flex-col gap-1 pr-4 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono text-secondary bg-surface-container-high px-1.5 py-0.5 rounded truncate">
                                  {ticket.ticketCode}
                                </span>
                                <StatusBadge status={ticket.status} className="scale-90 origin-left" />
                                {dateRangeText && (
                                  <span className="text-[9px] text-secondary font-medium">
                                    {dateRangeText}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-on-background text-sm truncate" title={ticket.issueTitle}>{ticket.issueTitle}</h4>
                              <div className="flex items-center gap-1.5 text-xxs text-secondary flex-wrap">
                                <span>Project: <strong className="text-on-background">{ticket.masterProject?.name || 'Unknown'}</strong></span>
                                <span>•</span>
                                <span>Spent: <strong className="text-primary">{ticketMandays.toFixed(2)} md</strong> ({ticket.hoursSpent} hrs)</span>
                              </div>
                              <p className="text-xxs text-secondary truncate">Assignees: {assigneesText}</p>
                            </div>
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                              isSelected ? "bg-primary border-primary text-on-primary" : "border-outline"
                            )}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preview Breakdown */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-on-background mb-2">Billing Calculation Preview</h2>
              
              <div className="w-full overflow-x-auto border border-outline-variant rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase">Item/Breakdown</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase">Role</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase">Members</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Mandays</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Rate/Manday</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {isPreviewLoading ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary">Loading preview calculations...</td></tr>
                      ) : breakdownData.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary">No matching activities, members or tickets found for the selected period.</td></tr>
                      ) : (
                        breakdownData.map((row: any, i: number) => {
                          const isSupport = row.projectName?.startsWith('[SUP]');
                          const cleanProjectName = isSupport ? row.projectName.replace(/^\[SUP\]\s*/, '') : row.projectName;
                          return (
                            <tr key={i} className="hover:bg-surface-container-lowest/50">
                              <td className="px-4 py-3 text-sm font-semibold text-on-background max-w-[280px]">
                                <div className="flex flex-col gap-1">
                                  <span className="truncate block font-semibold" title={cleanProjectName}>{cleanProjectName}</span>
                                  <div>
                                    {isSupport ? (
                                      <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full inline-block">
                                        Support Ticket
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full inline-block">
                                        Project Mandays
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-primary">{row.roleName}</td>
                              <td className="px-4 py-3 text-sm text-secondary truncate max-w-[200px]" title={row.memberNames}>{row.memberNames}</td>
                              <td className="px-4 py-3 text-sm text-secondary text-right">{Number(row.mandays).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-secondary text-right">{formatCurrency(row.ratePerManday)}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-on-background text-right">{formatCurrency(row.subtotal)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {!isPreviewLoading && breakdownData.length > 0 && (
                      <tfoot className="bg-surface-container-low border-t border-outline-variant font-semibold">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right">Subtotal</td>
                          <td className="px-4 py-3 text-right">{Number(previewData?.totalMandays).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-primary">{formatCurrency(subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right text-secondary text-sm">Estimated Tax ({taxRate}%)</td>
                          <td className="px-4 py-3 text-right text-error text-sm">{formatCurrency(taxAmount)}</td>
                        </tr>
                        <tr className="text-lg border-t-2 border-primary">
                          <td colSpan={5} className="px-4 py-4 text-right">Grand Total</td>
                          <td className="px-4 py-4 text-right text-green-700 font-bold">{formatCurrency(grandTotal)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
            </div>
          )}

          {/* STEP 4: Complete */}
          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto py-12 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-on-background mb-2">Billing Saved!</h2>
                <p className="text-secondary text-sm">
                  {billingType === 'PROJECT' ? 'Project' : 'Support'} billing support data record <strong className="text-primary">{createdBilling?.billingNumber}</strong> has been successfully registered.
                </p>
              </div>
              <div className="flex gap-4 w-full mt-4">
                <button 
                  onClick={() => exportBillingToExcel(createdBilling)}
                  className="flex-1 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition-colors cursor-pointer flex justify-center items-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Export to Excel
                </button>
                <button 
                  onClick={handleCancelCreation}
                  className="flex-1 px-4 py-2.5 border border-outline-variant hover:bg-surface-container-low text-secondary hover:text-on-background font-semibold rounded-lg transition-colors cursor-pointer text-center"
                >
                  Back to Billings List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Footer Actions */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center mt-auto">
          <button 
            onClick={() => {
              if (currentStep === 3) {
                setCurrentStep(2);
              } else {
                setCurrentStep(prev => Math.max(1, prev - 1));
              }
            }}
            disabled={currentStep === 1 || currentStep === 4}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {currentStep === 1 && (
            <button 
              onClick={() => setCurrentStep(2)}
              disabled={!startDate || !endDate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && (
            <button 
              onClick={() => setCurrentStep(3)}
              disabled={
                (billingType === 'PROJECT' && selectedProjects.length === 0) ||
                (billingType === 'SUPPORT' && selectedTickets.length === 0)
              }
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 3 && (
            <button 
              onClick={handleGenerateBilling}
              disabled={createBillingMutation.isPending || breakdownData.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm cursor-pointer"
            >
              {createBillingMutation.isPending ? 'Saving...' : 'Save Billing Document'}
            </button>
          )}

          {currentStep === 4 && (
            <button 
              onClick={() => {
                setSelectedProjects([]);
                setSelectedTickets([]);
                setRemarks('');
                setCreatedBilling(null);
                setCurrentStep(1);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm cursor-pointer"
            >
              Create Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
