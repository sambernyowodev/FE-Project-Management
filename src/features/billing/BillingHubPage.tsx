import { useState } from 'react';
import { Building2, FileText, CalendarDays, Calculator, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { exportInvoiceToExcel } from '@/shared/lib/excel';

const steps = [
  { id: 1, name: 'Select Project', icon: Building2 },
  { id: 2, name: 'Select PO', icon: FileText },
  { id: 3, name: 'Set Period', icon: CalendarDays },
  { id: 4, name: 'Preview', icon: Calculator },
  { id: 5, name: 'Complete', icon: CheckCircle2 }
];

import { useGetProjects } from '@/modules/projects/hooks/useProjects';
import { useGetPurchaseOrdersByProject } from '@/modules/purchase-orders/hooks/usePurchaseOrders';
import { useGetBillingPreview } from '@/modules/billing/hooks/useBilling';

const COLORS = ['#0052cc', '#7029e1', '#0c56d0', '#5600be', '#0b1c30'];

export function BillingHubPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedPo, setSelectedPo] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-03-31');
  const [taxRate, setTaxRate] = useState<number>(11);

  const { data: projects = [], isLoading: isProjectsLoading } = useGetProjects();
  const { data: purchaseOrders = [], isLoading: isPoLoading } = useGetPurchaseOrdersByProject(selectedProject || undefined);
  
  const { data: previewData, isLoading: isPreviewLoading } = useGetBillingPreview({
    projectId: selectedProject!,
    poId: selectedPo!,
    startDate,
    endDate,
    taxRate: taxRate
  }, currentStep >= 4 && !!selectedProject && !!selectedPo);

  const breakdownData = previewData?.breakdown || [];
  const pieData = breakdownData.map((b: any) => ({ name: b.role, value: b.subtotal }));


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Billing Wizard</h1>
        <p className="text-secondary text-sm">Generate invoices automatically based on project actuals and role rates.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Stepper */}
        <div className="border-b border-outline-variant p-6 bg-surface-container-low/50">
          <div className="flex items-center justify-between relative max-w-3xl mx-auto">
            {/* Progress line */}
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

        {/* Content Area */}
        <div className="p-6 min-h-[400px]">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-on-background text-center mb-4">Select a Project to Bill</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isProjectsLoading ? (
                  <p className="text-secondary text-sm">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="text-secondary text-sm">No projects available.</p>
                ) : (
                  projects.map(project => (
                    <div 
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={cn(
                        "p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                        selectedProject === project.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-outline-variant bg-surface-container-lowest hover:border-primary/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-secondary bg-surface-container-high px-2 py-1 rounded">{project.projectCode || `PRJ-${project.id}`}</span>
                        {selectedProject === project.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <h3 className="font-bold text-on-background text-lg">{project.name}</h3>
                      <p className="text-sm text-secondary mt-1">{project.picClient || '-'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-on-background text-center mb-4">Select Purchase Order</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isPoLoading ? (
                  <p className="text-secondary text-sm">Loading purchase orders...</p>
                ) : purchaseOrders.length === 0 ? (
                  <p className="text-secondary text-sm">No purchase orders found for this project.</p>
                ) : (
                  purchaseOrders.map((po: any) => (
                    <div 
                      key={po.id}
                      onClick={() => setSelectedPo(po.id)}
                      className={cn(
                        "p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                        selectedPo === po.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-outline-variant bg-surface-container-lowest hover:border-primary/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-secondary bg-surface-container-high px-2 py-1 rounded">{po.poName || `PO-${po.id}`}</span>
                        {selectedPo === po.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <h3 className="font-bold text-on-background text-lg">{po.description || po.poName}</h3>
                      <p className="text-sm font-semibold text-primary mt-2">{formatCurrency(po.totalAmount || 0)} Total Value</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6 max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-on-background text-center mb-4">Set Billing Period & Tax</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-background">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-background">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-sm font-semibold text-on-background">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-full px-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-on-background mb-4">Invoice Preview</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 overflow-x-auto border border-outline-variant rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase">Role</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase">Member</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Mandays</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Rate/Manday</th>
                        <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {isPreviewLoading ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary">Loading preview...</td></tr>
                      ) : breakdownData.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary">No data for the selected period.</td></tr>
                      ) : (
                        breakdownData.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-surface-container-lowest/50">
                            <td className="px-4 py-3 text-sm font-bold text-primary">{row.role}</td>
                            <td className="px-4 py-3 text-sm text-on-background">{row.name}</td>
                            <td className="px-4 py-3 text-sm text-secondary text-right">{Number(row.mandays).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-secondary text-right">{formatCurrency(row.rate)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-on-background text-right">{formatCurrency(row.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-surface-container-low border-t border-outline-variant font-semibold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right">Subtotal</td>
                        <td className="px-4 py-3 text-right">100.00</td>
                        <td className="px-4 py-3 text-right"></td>
                        <td className="px-4 py-3 text-right text-primary">{formatCurrency(206600000)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-secondary text-sm">Tax (11%)</td>
                        <td className="px-4 py-3 text-right text-error text-sm">{formatCurrency(22726000)}</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={4} className="px-4 py-4 text-right">Grand Total</td>
                        <td className="px-4 py-4 text-right text-green-700">{formatCurrency(229326000)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
                   <h3 className="text-sm font-bold text-on-background mb-4 self-start">Cost Breakdown</h3>
                   <ResponsiveContainer width="100%" height={250}>
                     <PieChart>
                       <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                         {pieData.map((_entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto py-12 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-on-background mb-2">Invoice Generated!</h2>
                <p className="text-secondary text-sm">Invoice <strong className="text-primary">INV-202603-001</strong> has been successfully created and saved.</p>
              </div>
              <div className="flex gap-4 w-full mt-4">
                <button className="flex-1 px-4 py-2 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
                  Download PDF
                </button>
                <button 
                  onClick={exportInvoiceToExcel}
                  className="flex-1 px-4 py-2 bg-[#107c41] text-white font-semibold rounded-lg hover:bg-[#0f6b38] transition-colors cursor-pointer flex justify-center items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center mt-auto">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || currentStep === 5}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {currentStep < 4 && (
            <button 
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              disabled={(currentStep === 1 && !selectedProject) || (currentStep === 2 && !selectedPo)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 4 && (
            <button 
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-sm cursor-pointer"
            >
              Generate Invoice
            </button>
          )}

          {currentStep === 5 && (
            <button 
              onClick={() => {
                setCurrentStep(1);
                setSelectedProject(null);
                setSelectedPo(null);
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
