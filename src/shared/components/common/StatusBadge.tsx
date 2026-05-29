import { cn } from "@/shared/lib/utils";
import {
  ProjectStatus,
  PurchaseOrderStatus,
  SalesOrderStatus,
  SupportTicketStatus,
  InvoiceStatus
} from "@/shared/constants/enums";

type StatusType =
  | keyof typeof ProjectStatus
  | keyof typeof PurchaseOrderStatus
  | keyof typeof SalesOrderStatus
  | keyof typeof SupportTicketStatus
  | keyof typeof InvoiceStatus;

const statusStyles: Record<StatusType, string> = {
  PLANNING: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  SIT: "bg-sky-100 text-sky-700 border-sky-200",
  UAT: "bg-purple-100 text-purple-700 border-purple-200",
  CLOSED: "bg-green-100 text-green-700 border-green-200",
  ON_HOLD: "bg-amber-100 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  FUT: "bg-teal-100 text-teal-700 border-teal-200",

  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  DELIVERED: "bg-purple-100 text-purple-700 border-purple-200",
  INVOICED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  SENT: "bg-blue-100 text-blue-700 border-blue-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
  OPEN: "bg-red-100 text-red-700 border-red-200",
  DEV_DONE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SIT_DONE: "bg-sky-100 text-sky-700 border-sky-200",
  UAT_DONE: "bg-purple-100 text-purple-700 border-purple-200",
  DONE: "bg-green-100 text-green-700 border-green-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const lookupKey = status.replace(/ /g, '_') as StatusType;
  const style = statusStyles[lookupKey] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center justify-center uppercase", style, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
