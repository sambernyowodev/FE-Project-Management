import { parseLocalDate, formatDate } from './formatter';
import type { Holiday } from '@/modules/master/holidays/types';

export interface ActivityCalculationItem {
  mandays?: number | null;
  progressPct?: number | null;
  progress_pct?: number | null;
  startDate?: string | null;
  start_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
}

/**
 * Calculates overall project progress percentage based on its activities.
 * Uses mandays-weighted progress if mandays are entered; otherwise uses average progress.
 */
export function calculateProjectProgress(activities?: ActivityCalculationItem[] | null): number {
  if (!activities || activities.length === 0) return 0;

  const totalMandays = activities.reduce((acc, curr) => {
    const md = Math.round(Number(curr.mandays) || 0);
    return acc + md;
  }, 0);

  if (totalMandays > 0) {
    const weightedProgress = activities.reduce((acc, curr) => {
      const pct = Number(curr.progressPct ?? curr.progress_pct ?? 0);
      const md = Math.round(Number(curr.mandays) || 0);
      return acc + (pct * md);
    }, 0);
    return Math.round((weightedProgress / totalMandays) * 10) / 10;
  }

  const avgProgress = activities.reduce((acc, curr) => {
    const pct = Number(curr.progressPct ?? curr.progress_pct ?? 0);
    return acc + pct;
  }, 0) / activities.length;

  return Math.round(avgProgress * 10) / 10;
}

/**
 * Calculates dynamic actual schedule (earliest start date and latest end date) from activities.
 */
export function calculateProjectSchedule(
  activities?: ActivityCalculationItem[] | null,
  fallbackStartDate?: string | null,
  fallbackEndDate?: string | null
): { actualStart: string | null; actualEnd: string | null } {
  if (!activities || activities.length === 0) {
    return {
      actualStart: fallbackStartDate || null,
      actualEnd: fallbackEndDate || null,
    };
  }

  const validStartDates = activities
    .map(a => {
      const d = a.startDate || a.start_date;
      return d ? parseLocalDate(d) : null;
    })
    .filter((d): d is Date => d !== null);

  const validEndDates = activities
    .map(a => {
      const d = a.endDate || a.end_date;
      return d ? parseLocalDate(d) : null;
    })
    .filter((d): d is Date => d !== null);

  const actualStart = validStartDates.length > 0
    ? formatDate(new Date(Math.min(...validStartDates.map(d => d.getTime()))), 'input')
    : (fallbackStartDate || null);

  const actualEnd = validEndDates.length > 0
    ? formatDate(new Date(Math.max(...validEndDates.map(d => d.getTime()))), 'input')
    : (fallbackEndDate || null);

  return { actualStart, actualEnd };
}

/**
 * Creates a Map for quick lookup of holidays by date string (YYYY-MM-DD).
 */
export function createHolidayMap(holidays: Holiday[]): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  (holidays || []).forEach(h => {
    if (h.holidayDate) {
      const dateKey = formatDate(h.holidayDate, 'iso');
      if (dateKey) {
        map.set(dateKey, h);
      }
    }
  });
  return map;
}

/**
 * Calculates accurate working mandays between start date and end date.
 * Excludes weekends (Saturday & Sunday) and national holidays from the master holidays list.
 */
export function calculateWorkingMandays(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  holidays?: Holiday[] | Map<string, Holiday> | Set<string>
): number {
  if (!startDate || !endDate) return 0;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end || start > end) return 0;

  let holidayMap: Map<string, Holiday> | null = null;
  let holidaySet: Set<string> | null = null;

  if (holidays instanceof Map) {
    holidayMap = holidays;
  } else if (holidays instanceof Set) {
    holidaySet = holidays;
  } else if (Array.isArray(holidays)) {
    holidayMap = createHolidayMap(holidays);
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    if (!isWeekend) {
      const dateKey = formatDate(current, 'iso');
      let isHoliday = false;

      if (holidayMap && dateKey) {
        const hol = holidayMap.get(dateKey);
        isHoliday = Boolean(hol);
      } else if (holidaySet && dateKey) {
        isHoliday = holidaySet.has(dateKey);
      }

      if (!isHoliday) {
        workingDays += 1;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

/**
 * Calculates total calendar duration days between start date and end date.
 */
export function calculateCalendarDays(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): number {
  if (!startDate || !endDate) return 0;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end || start > end) return 0;

  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Checks whether a given date is a national holiday.
 */
export function isNationalHoliday(
  date: string | Date | null | undefined,
  holidays?: Holiday[] | Map<string, Holiday>
): Holiday | null {
  if (!date) return null;
  const d = parseLocalDate(date);
  if (!d) return null;

  const dateKey = formatDate(d, 'iso');
  if (!dateKey) return null;

  if (holidays instanceof Map) {
    const h = holidays.get(dateKey);
    return h || null;
  }

  if (Array.isArray(holidays)) {
    const h = holidays.find(item => formatDate(item.holidayDate, 'iso') === dateKey);
    return h || null;
  }

  return null;
}
