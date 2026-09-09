import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isAfter
} from 'date-fns';
import { formatDate, parseLocalDate } from '@/shared/lib/formatter';
import { Milestone, User, Calendar, CheckCircle2 } from 'lucide-react';
import type { ProjectActivity, ProjectMember } from '@/modules/projects/types';

interface GanttChartProps {
  project: {
    startDate?: string;
    endDate?: string;
    name: string;
  };
  activities: ProjectActivity[];
  members: ProjectMember[];
}

export function GanttChart({ project, activities = [], members = [] }: GanttChartProps) {
  // 1. Calculate Timeline Start and End Dates based on project and activities
  const { timelineStart, days, monthGroups } = useMemo(() => {
    const validDates: Date[] = [];

    const projStart = parseLocalDate(project.startDate);
    const projEnd = parseLocalDate(project.endDate);
    if (projStart) validDates.push(projStart);
    if (projEnd) validDates.push(projEnd);

    activities.forEach(act => {
      if (act.startDate) {
        const actStart = parseLocalDate(act.startDate);
        if (actStart) validDates.push(actStart);
      }
      if (act.endDate) {
        const actEnd = parseLocalDate(act.endDate);
        if (actEnd) validDates.push(actEnd);
      }
    });

    let minDate: Date;
    let maxDate: Date;

    if (validDates.length > 0) {
      const timestamps = validDates.map(d => d.getTime());
      minDate = new Date(Math.min(...timestamps));
      maxDate = new Date(Math.max(...timestamps));
    } else {
      minDate = new Date();
      maxDate = addDays(new Date(), 30);
    }

    if (minDate > maxDate) {
      maxDate = minDate;
    }

    // Align start to Monday of that week and end to Sunday of that week for clean weekly bounds
    const paddedStart = startOfWeek(minDate, { weekStartsOn: 1 });
    const paddedEnd = endOfWeek(maxDate, { weekStartsOn: 1 });

    // Generate list of all individual days in the range
    const dayList: Date[] = [];
    let currentDay = paddedStart;
    while (currentDay <= paddedEnd) {
      dayList.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    // Ensure at least 14 days for layout breathing room
    while (dayList.length < 14) {
      const lastDay = dayList[dayList.length - 1] || paddedStart;
      dayList.push(addDays(lastDay, 1));
    }

    const finalEnd = dayList[dayList.length - 1];

    // Group days by Month & Year for the top header tier
    const groups: { label: string; yearMonth: string; dayCount: number }[] = [];
    dayList.forEach(day => {
      const ym = `${day.getFullYear()}-${day.getMonth()}`;
      const existing = groups.find(g => g.yearMonth === ym);
      if (existing) {
        existing.dayCount++;
      } else {
        const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(day);
        groups.push({
          label: monthName,
          yearMonth: ym,
          dayCount: 1
        });
      }
    });

    return {
      timelineStart: paddedStart,
      timelineEnd: finalEnd,
      days: dayList,
      monthGroups: groups
    };
  }, [project, activities]);

  const totalDays = days.length;
  const dayColWidth = 36; // px per day column
  const minTableWidth = Math.max(900, 256 + days.length * dayColWidth);

  // Flatten and sort activities so hierarchy is respected
  const sortedActivities = useMemo(() => {
    const rootActivities = activities
      .filter(a => !a.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
      
    const result: ProjectActivity[] = [];
    rootActivities.forEach(parent => {
      result.push(parent);
      const children = activities
        .filter(a => a.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      result.push(...children);
    });
    return result;
  }, [activities]);

  const getMemberName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const member = members.find(m => m.memberId === userId || m.user?.id === userId);
    return member?.user?.fullName || `User ID: ${userId}`;
  };

  // Helper to check if a task is overdue
  const isOverdue = (act: ProjectActivity) => {
    if (act.progressPct === 100 || act.isMilestone) return false;
    if (!act.endDate) return false;
    const end = parseLocalDate(act.endDate);
    return end ? isAfter(new Date(), end) : false;
  };

  // Calculate Today Line Position (percentage of timeline width)
  const todayPosition = useMemo(() => {
    const today = new Date();
    const diffMs = today.getTime() - timelineStart.getTime();
    const totalMs = totalDays * 24 * 60 * 60 * 1000;
    if (diffMs >= 0 && diffMs <= totalMs) {
      return (diffMs / totalMs) * 100;
    }
    return null;
  }, [timelineStart, totalDays]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Header Panel */}
      <div className="px-6 py-3.5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-on-background">Gantt Chart Timeline</h3>
          <p className="text-xs text-secondary mt-0.5">Visualisasi jadwal rencana harian dan progress aktivitas project.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
            <span className="text-secondary">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded"></div>
            <span className="text-secondary">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3 bg-gradient-to-r from-rose-500 to-amber-600 rounded"></div>
            <span className="text-secondary">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-500 rotate-45"></div>
            <span className="text-secondary">Milestone</span>
          </div>
        </div>
      </div>

      {/* Gantt Main Grid (Horizontal & Vertical Scroll) */}
      <div className="overflow-auto flex-1 relative">
        <div className="flex flex-col relative" style={{ minWidth: `${minTableWidth}px`, height: 'fit-content' }}>
          
          {/* Sticky Header Group */}
          <div className="sticky top-0 z-30 shadow-xs">
            {/* Header Row 1: Month Groups */}
            <div className="flex border-b border-outline-variant bg-surface-container-low">
              {/* Task list spacer (Frozen Column Header 1) */}
              <div className="w-64 shrink-0 border-r border-outline-variant px-4 py-2 text-xs font-bold text-secondary uppercase tracking-wider bg-surface-container-low flex items-center sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <span>Bulan & Periode</span>
              </div>
              {/* Months row */}
              <div className="flex-1 flex relative bg-surface-container-low" style={{ minWidth: `${days.length * dayColWidth}px` }}>
                {monthGroups.map((mg) => (
                  <div 
                    key={mg.yearMonth} 
                    className="text-center border-r border-outline-variant/60 py-1.5 px-2 bg-surface-container-low/50 text-xs font-bold text-on-background truncate flex items-center justify-center"
                    style={{ 
                      width: `${(mg.dayCount / totalDays) * 100}%`, 
                      minWidth: `${mg.dayCount * dayColWidth}px` 
                    }}
                    title={mg.label}
                  >
                    <span>{mg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Header Row 2: Days and Dates */}
            <div className="flex border-b border-outline-variant bg-surface-container-low">
              {/* Task list header (Frozen Column Header 2) */}
              <div className="w-64 shrink-0 border-r border-outline-variant px-4 py-2 text-xs font-bold text-secondary uppercase tracking-wider bg-surface-container-low flex items-center sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Aktivitas
              </div>
              {/* Days columns */}
              <div className="flex-1 flex relative bg-surface-container-low" style={{ minWidth: `${days.length * dayColWidth}px` }}>
                {days.map((day) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isTodayDate = day.toDateString() === new Date().toDateString();
                  const dayNameShort = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'][day.getDay()];

                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`flex-1 text-center border-r border-outline-variant/40 py-1.5 flex flex-col items-center justify-center min-w-[36px] ${
                        isTodayDate
                          ? 'bg-red-500/10'
                          : isWeekend
                          ? 'bg-surface-container-high/40'
                          : 'bg-surface-container-low/20'
                      }`}
                      title={formatDate(day, 'long')}
                    >
                      <span className={`text-[9px] ${
                        isTodayDate 
                          ? 'text-red-600 font-bold' 
                          : isWeekend 
                          ? 'text-secondary/60 font-medium' 
                          : 'text-secondary font-medium'
                      }`}>
                        {dayNameShort}
                      </span>
                      <span className={`text-[11px] font-mono leading-tight ${
                        isTodayDate 
                          ? 'text-red-600 font-extrabold' 
                          : isWeekend 
                          ? 'text-secondary/70 font-semibold' 
                          : 'text-on-background font-semibold'
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rows container with relative positioning for grid lines and today line */}
          <div className="relative flex flex-col">
            
            {/* Today indicator vertical line */}
            {todayPosition !== null && (
              <div className="absolute inset-y-0 left-64 right-0 pointer-events-none z-20" style={{ minWidth: `${days.length * dayColWidth}px` }}>
                <div 
                  className="absolute inset-y-0 w-0 border-l-2 border-dashed border-red-500 group/today"
                  style={{ left: `${todayPosition}%` }}
                >
                  <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                    TODAY
                  </div>
                </div>
              </div>
            )}

            {/* Empty activities state */}
            {sortedActivities.length === 0 && (
              <div className="flex items-center justify-center py-20 text-secondary w-full">
                Belum ada aktivitas. Silakan tambahkan aktivitas terlebih dahulu.
              </div>
            )}

            {/* Timeline Rows */}
            {sortedActivities.map((act) => {
              const isChild = Boolean(act.parentId);
              const actStart = act.startDate ? parseLocalDate(act.startDate) : null;
              const actEnd = act.endDate ? parseLocalDate(act.endDate) : null;
              const actOverdue = isOverdue(act);

              // Calculate contiguous active weekday segments (merged adjacent days, weekends empty)
              const segments: { startIdx: number; endIdx: number; count: number }[] = [];
              if (actStart && actEnd && !act.isMilestone) {
                let currentStartIdx: number | null = null;
                days.forEach((day, idx) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isActive = day >= actStart && day <= actEnd && !isWeekend;

                  if (isActive) {
                    if (currentStartIdx === null) {
                      currentStartIdx = idx;
                    }
                  } else {
                    if (currentStartIdx !== null) {
                      segments.push({
                        startIdx: currentStartIdx,
                        endIdx: idx - 1,
                        count: idx - currentStartIdx
                      });
                      currentStartIdx = null;
                    }
                  }
                });

                if (currentStartIdx !== null) {
                  segments.push({
                    startIdx: currentStartIdx,
                    endIdx: days.length - 1,
                    count: days.length - currentStartIdx
                  });
                }
              }

              // Milestone index
              let milestoneIdx = -1;
              if (act.isMilestone) {
                const mDate = actStart || actEnd;
                if (mDate) {
                  const mDateStr = formatDate(mDate, 'input');
                  milestoneIdx = days.findIndex(d => formatDate(d, 'input') === mDateStr);
                }
              }

              const hasSchedule = segments.length > 0 || (act.isMilestone && milestoneIdx !== -1);

              // Select progress bar color scheme
              let barGradient = 'from-blue-500 to-indigo-600';
              let barBorder = 'border-blue-600/50';
              if (act.progressPct === 100) {
                barGradient = 'from-emerald-500 to-teal-600';
                barBorder = 'border-emerald-600/50';
              } else if (actOverdue) {
                barGradient = 'from-rose-500 to-amber-600';
                barBorder = 'border-rose-600/50';
              }

              return (
                <div 
                  key={act.id} 
                  className={`flex border-b border-outline-variant/40 hover:bg-surface-container-low/20 transition-all items-center ${
                    isChild ? 'h-11 bg-surface-container-lowest/20' : 'h-12 bg-surface-container-lowest font-medium'
                  }`}
                >
                  {/* Left Column: Activity Name (Frozen Sticky Column) */}
                  <div className={`w-64 shrink-0 border-r border-outline-variant px-4 py-1.5 flex items-center gap-1.5 overflow-hidden h-full sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] ${
                    isChild ? 'bg-surface-container-lowest/95' : 'bg-surface-container-lowest'
                  }`}>
                    {isChild && (
                      <div className="w-4 border-b border-l border-outline-variant/60 h-4 -mt-2 shrink-0 ml-1 rounded-bl"></div>
                    )}
                    <span 
                      className={`truncate text-xs ${isChild ? 'text-on-surface-variant' : 'text-on-background font-semibold'}`}
                      title={act.activityName}
                    >
                      {act.activityName}
                    </span>
                  </div>

                  {/* Right Column: Timeline Area with Merged Bars and Weekend Backgrounds */}
                  <div className="flex-1 h-full relative flex items-center" style={{ minWidth: `${days.length * dayColWidth}px` }}>
                    
                    {/* Background Day Columns & Weekend Grid */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {days.map((day) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const isTodayDate = day.toDateString() === new Date().toDateString();

                        return (
                          <div 
                            key={day.toISOString()} 
                            className={`flex-1 min-w-[36px] h-full border-r border-outline-variant/25 ${
                              isTodayDate 
                                ? 'bg-red-500/[0.04]' 
                                : isWeekend 
                                ? 'bg-surface-container-high/30' 
                                : ''
                            }`} 
                          />
                        );
                      })}
                    </div>

                    {hasSchedule ? (
                      <>
                        {/* Milestone Diamond Marker */}
                        {act.isMilestone && milestoneIdx !== -1 && (
                          <div 
                            className="absolute z-10 group/milestone cursor-pointer -translate-x-1/2"
                            style={{ left: `${((milestoneIdx + 0.5) / totalDays) * 100}%` }}
                          >
                            <div className="w-4 h-4 bg-amber-500 border-2 border-white rotate-45 shadow-sm hover:scale-125 hover:bg-amber-600 transition-all duration-150"></div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/milestone:flex flex-col gap-1.5 bg-surface-container-lowest border border-outline-variant p-3 rounded-lg shadow-xl z-50 text-xs w-56 animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
                              <span className="font-bold text-on-background flex items-center gap-1.5">
                                <Milestone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {act.activityName}
                              </span>
                              <div className="flex items-center gap-1 text-secondary font-medium">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span>{act.startDate ? formatDate(act.startDate, 'short') : formatDate(act.endDate, 'short')}</span>
                              </div>
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                                Milestone Project
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Merged Continuous Activity Bars (per contiguous weekday segment) */}
                        {!act.isMilestone && segments.map((seg) => {
                          const leftPercent = (seg.startIdx / totalDays) * 100;
                          const widthPercent = (seg.count / totalDays) * 100;

                          return (
                            <div 
                              key={`${act.id}-seg-${seg.startIdx}`}
                              className={`absolute h-6 rounded-md bg-gradient-to-r ${barGradient} border ${barBorder} shadow-xs overflow-hidden group/bar cursor-pointer hover:shadow-md hover:brightness-105 transition-all z-10 flex items-center`}
                              style={{ 
                                left: `calc(${leftPercent}% + 2px)`, 
                                width: `calc(${Math.max(0.3, widthPercent)}% - 4px)`
                              }}
                            >
                              {/* Progress highlight overlay */}
                              {(act.progressPct || 0) > 0 && (act.progressPct || 0) < 100 && (
                                <div 
                                  className="h-full bg-white/20 border-r border-white/40 transition-all duration-300"
                                  style={{ width: `${act.progressPct}%` }}
                                />
                              )}

                              {/* Centered Progress label */}
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white font-mono drop-shadow-xs px-1 truncate pointer-events-none">
                                {act.progressPct || 0}%
                              </span>

                              {/* Detail Tooltip */}
                              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col gap-1.5 bg-surface-container-lowest border border-outline-variant p-3 rounded-lg shadow-xl z-50 text-xs w-60 animate-in fade-in zoom-in-95 duration-100 cursor-default pointer-events-none">
                                <span className="font-bold text-on-background truncate border-b border-outline-variant pb-1.5 flex items-center gap-1.5">
                                  {act.progressPct === 100 ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                                  )}
                                  {act.activityName}
                                </span>
                                
                                <div className="flex flex-col gap-1 text-secondary font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    <span>{formatDate(act.startDate, 'short')} - {formatDate(act.endDate, 'short')}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] mt-1 bg-surface-container-low p-1.5 rounded border border-outline-variant/40">
                                    <span>Durasi: <strong>{act.durationDays} hari</strong></span>
                                    <span>Mandays: <strong>{Math.round(act.mandays || 0)} md</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 border-t border-outline-variant/30 pt-1.5">
                                    <User className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Assignee: <strong>{getMemberName(act.assignedToId || undefined)}</strong></span>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-1 border-t border-outline-variant/30 pt-1.5">
                                  <span className="text-[10px] text-secondary font-semibold">Progress</span>
                                  <span className={`text-[10px] font-bold ${act.progressPct === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                                    {act.progressPct}% {actOverdue && '(Overdue)'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      /* No schedule placeholder line */
                      <div className="text-[10px] text-secondary/40 font-normal italic pl-4">
                        Jadwal belum ditentukan
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
