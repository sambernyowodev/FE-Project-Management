import { cn } from "@/shared/lib/utils";
import {
  ProjectStatus,
  SupportTicketStatus,
} from "@/shared/constants/enums";

type StatusType =
  | keyof typeof ProjectStatus
  | keyof typeof SupportTicketStatus;

const statusStyles: Record<StatusType, string> = {
  PLANNING: "bg-sky-900/15 text-sky-900 border-sky-900/30",
  IN_PROGRESS: "bg-orange-100 text-orange-700 border-orange-200",
  SIT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  UAT: "bg-blue-900/15 text-blue-900 border-blue-900/30",
  PENTEST: "bg-yellow-100 text-yellow-800 border-yellow-300",
  FUT: "bg-purple-100 text-purple-700 border-purple-200",
  CLOSED: "bg-green-100 text-green-700 border-green-200",
  ON_HOLD: "bg-amber-100 text-amber-800 border-amber-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  OPEN: "bg-red-100 text-red-700 border-red-200",
  DEV_DONE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SIT_DONE: "bg-cyan-100 text-cyan-700 border-cyan-200",
  UAT_DONE: "bg-blue-900/15 text-blue-900 border-blue-900/30",
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
