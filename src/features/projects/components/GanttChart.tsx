import { useMemo } from 'react';
import { 
  differenceInDays, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  addDays, 
  isAfter
} from 'date-fns';
import { formatDate } from '@/shared/lib/formatter';
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
  // 1. Calculate Timeline Start and End Dates
  const { timelineStart, timelineEnd, weeks } = useMemo(() => {
    let start = project.startDate ? new Date(project.startDate) : new Date();
    let end = project.endDate ? new Date(project.endDate) : addDays(new Date(), 60);

    // Factor in activities dates if they extend beyond project dates
    activities.forEach(act => {
      if (act.startDate) {
        const actStart = new Date(act.startDate);
        if (actStart < start) start = actStart;
      }
      if (act.endDate) {
        const actEnd = new Date(act.endDate);
        if (actEnd > end) end = actEnd;
      }
    });

    // Pad start and end to the start/end of the respective weeks
    const paddedStart = startOfWeek(addDays(start, -7), { weekStartsOn: 1 }); // Monday
    const paddedEnd = endOfWeek(addDays(end, 7), { weekStartsOn: 1 }); // Sunday

    // Generate list of weeks in the range
    const weekList: Date[] = [];
    let currentWeek = paddedStart;
    while (currentWeek <= paddedEnd) {
      weekList.push(currentWeek);
      currentWeek = addWeeks(currentWeek, 1);
    }

    return {
      timelineStart: paddedStart,
      timelineEnd: paddedEnd,
      weeks: weekList
    };
  }, [project, activities]);

  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;

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

  const getMemberName = (userId?: number) => {
    if (!userId) return 'Unassigned';
    const member = members.find(m => m.userId === userId);
    return member?.user?.fullName || `User ID: ${userId}`;
  };

  // Helper to check if a task is overdue
  const isOverdue = (act: ProjectActivity) => {
    if (act.progressPct === 100 || act.isMilestone) return false;
    if (!act.endDate) return false;
    return isAfter(new Date(), new Date(act.endDate));
  };

  // Calculate Today Line Position
  const todayPosition = useMemo(() => {
    const today = new Date();
    if (today >= timelineStart && today <= timelineEnd) {
      const daysFromStart = differenceInDays(today, timelineStart);
      return (daysFromStart / totalDays) * 100;
    }
    return null;
  }, [timelineStart, timelineEnd, totalDays]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header Panel */}
      <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-on-background">Gantt Chart Timeline</h3>
          <p className="text-xs text-secondary mt-0.5">Visualisasi jadwal rencana dan progress aktivitas project.</p>
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

      {/* Gantt Main Grid */}
      <div className="overflow-x-auto flex-1">
        <div className="min-w-[900px] flex flex-col relative" style={{ height: 'fit-content' }}>
          
          {/* Timeline columns headers */}
          <div className="flex border-b border-outline-variant bg-surface-container-low/40">
            {/* Task list spacer */}
            <div className="w-64 shrink-0 border-r border-outline-variant px-4 py-3 text-xs font-bold text-secondary uppercase tracking-wider bg-surface-container-low/80">
              Aktivitas
            </div>
            {/* Weeks columns */}
            <div className="flex-1 flex relative">
              {weeks.map((week, idx) => (
                <div 
                  key={week.toISOString()} 
                  className="flex-1 text-center border-r border-outline-variant/50 py-2.5 flex flex-col min-w-[70px] bg-surface-container-low/20"
                >
                  <span className="text-[10px] font-bold text-secondary">W{idx + 1}</span>
                  <span className="text-[10px] font-medium text-secondary/70 mt-0.5">{formatDate(week, 'short')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows container with relative positioning for grid lines and today line */}
          <div className="relative flex flex-col">
            
            {/* Vertical grid lines overlay */}
            <div className="absolute inset-y-0 left-64 right-0 flex pointer-events-none">
              {weeks.map((week) => (
                <div key={week.toISOString() + '_grid'} className="flex-1 border-r border-outline-variant/30 h-full min-w-[70px]" />
              ))}
            </div>

            {/* Today indicator vertical line */}
            {todayPosition !== null && (
              <div 
                className="absolute inset-y-0 z-20 w-0 border-l-2 border-dashed border-red-500 pointer-events-none group/today"
                style={{ left: `calc(16rem + ${todayPosition}%)` }}
              >
                <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow-sm">
                  TODAY
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
              
              // Calculate positioning
              let leftPercent = 0;
              let widthPercent = 0;
              let hasSchedule = false;

              if (act.startDate && act.endDate) {
                const actStart = new Date(act.startDate);
                const actEnd = new Date(act.endDate);
                
                // Ensure dates fall within timeline bounds
                const startClamped = actStart < timelineStart ? timelineStart : actStart;
                const endClamped = actEnd > timelineEnd ? timelineEnd : actEnd;

                const daysFromStart = differenceInDays(startClamped, timelineStart);
                const taskDuration = differenceInDays(endClamped, startClamped) + 1;

                leftPercent = (daysFromStart / totalDays) * 100;
                widthPercent = (taskDuration / totalDays) * 100;
                hasSchedule = true;
              } else if (act.isMilestone && (act.startDate || act.endDate)) {
                // Milestones might only have one date
                const milestoneDate = new Date(act.startDate || act.endDate || new Date());
                if (milestoneDate >= timelineStart && milestoneDate <= timelineEnd) {
                  const daysFromStart = differenceInDays(milestoneDate, timelineStart);
                  leftPercent = (daysFromStart / totalDays) * 100;
                  widthPercent = 1.5; // Fixed small width for point
                  hasSchedule = true;
                }
              }

              const actOverdue = isOverdue(act);

              // Select progress bar color scheme
              let barGradient = 'from-blue-500 to-indigo-600';
              if (act.progressPct === 100) {
                barGradient = 'from-emerald-500 to-teal-600';
              } else if (actOverdue) {
                barGradient = 'from-rose-500 to-amber-600';
              }

              return (
                <div 
                  key={act.id} 
                  className={`flex border-b border-outline-variant/40 hover:bg-surface-container-low/20 transition-all items-center ${
                    isChild ? 'h-11 bg-surface-container-lowest/20' : 'h-12 bg-surface-container-lowest font-medium'
                  }`}
                >
                  {/* Left Column: Activity Name */}
                  <div className="w-64 shrink-0 border-r border-outline-variant px-4 py-1.5 flex items-center gap-1.5 overflow-hidden h-full">
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

                  {/* Right Column: Timeline Area */}
                  <div className="flex-1 h-full relative flex items-center px-2">
                    {hasSchedule ? (
                      act.isMilestone ? (
                        /* Milestone Diamond Marker */
                        <div 
                          className="absolute z-10 group/milestone cursor-pointer"
                          style={{ left: `${leftPercent}%` }}
                        >
                          <div className="w-4 h-4 bg-amber-500 border-2 border-white rotate-45 shadow-sm hover:scale-125 hover:bg-amber-600 transition-all duration-150"></div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/milestone:flex flex-col gap-1.5 bg-surface-container-lowest border border-outline-variant p-3 rounded-lg shadow-xl z-50 text-xs w-56 animate-in fade-in zoom-in-95 duration-100">
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
                      ) : (
                        /* Regular Activity Bar */
                        <div 
                          className="absolute h-6 rounded-md bg-surface-container-high border border-outline-variant/60 shadow-sm overflow-hidden group/bar cursor-pointer hover:shadow hover:border-primary/40 transition-all"
                          style={{ 
                            left: `${leftPercent}%`, 
                            width: `calc(${widthPercent}% - 8px)`
                          }}
                        >
                          {/* Progress fill */}
                          <div 
                            className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-300 relative`}
                            style={{ width: `${act.progressPct || 0}%` }}
                          >
                            {/* Inner progress label */}
                            {act.progressPct > 15 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white font-mono">
                                {act.progressPct}%
                              </span>
                            )}
                          </div>

                          {/* Outer progress label for short bars */}
                          {act.progressPct <= 15 && (
                            <span className="absolute left-[calc(100%+6px)] top-1/2 -translate-y-1/2 text-[9px] font-bold text-secondary font-mono">
                              {act.progressPct}%
                            </span>
                          )}

                          {/* Detail Tooltip */}
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col gap-1.5 bg-surface-container-lowest border border-outline-variant p-3 rounded-lg shadow-xl z-50 text-xs w-60 animate-in fade-in zoom-in-95 duration-100 cursor-default">
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
                                <span>Mandays: <strong>{act.mandays || 0} md</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 border-t border-outline-variant/30 pt-1.5">
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Assignee: <strong>{getMemberName(act.assignedToId)}</strong></span>
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
                      )
                    ) : (
                      /* No schedule placeholder line */
                      <div className="text-[10px] text-secondary/40 font-normal italic pl-2">
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
