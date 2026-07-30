import * as XLSX from 'xlsx';
import type { ProjectActivity, ProjectMember, Project } from '@/modules/projects/types';

export interface ParsedExcelRow {
  rowIndex: number;
  activityName: string;
  parentName?: string;
  phase?: string;
  feature?: string;
  subFeature?: string;
  details?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  mandays?: number;
  assignedToName?: string;
  progressPct?: number;
  isMilestone?: boolean;
  sortOrder?: number;
  // Metadata status
  isDuplicate?: boolean;
  existingActivityId?: string;
  errors?: string[];
}

export function generateTimelineExcelTemplate(
  project: Project,
  activities: ProjectActivity[],
  members: ProjectMember[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Map Activities to Rows
  // Flatten activities so children come under parents
  const rootActivities = activities
    .filter(a => !a.parentId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const sortedActivities: ProjectActivity[] = [];
  rootActivities.forEach(parent => {
    sortedActivities.push(parent);
    const children = activities
      .filter(a => a.parentId === parent.id)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    sortedActivities.push(...children);
  });

  const memberMap = new Map<string, string>();
  members.forEach(m => {
    const name = m.user?.fullName || m.user?.email || `Member-${m.memberId}`;
    if (m.memberId) memberMap.set(m.memberId, name);
    if (m.user?.id) memberMap.set(m.user.id, name);
  });

  const parentMap = new Map<string, string>();
  activities.forEach(a => parentMap.set(a.id, a.activityName));

  const timelineRows = sortedActivities.map((act, index) => ({
    'No': index + 1,
    'Activity Name': act.activityName,
    'Parent Activity': act.parentId ? parentMap.get(act.parentId) || '' : '',
    'Phase': act.phase || 'DEVELOPMENT',
    'Feature': act.feature || '',
    'Sub Feature': act.subFeature || '',
    'Details': act.details || '',
    'Start Date (YYYY-MM-DD)': act.startDate ? act.startDate.split('T')[0] : '',
    'End Date (YYYY-MM-DD)': act.endDate ? act.endDate.split('T')[0] : '',
    'Duration Days': act.durationDays !== undefined ? act.durationDays : '',
    'Mandays': act.mandays !== undefined ? act.mandays : '',
    'Assigned Resource': act.assignedToId ? memberMap.get(act.assignedToId) || '' : '',
    'Progress (%)': act.progressPct !== undefined ? act.progressPct : 0,
    'Is Milestone (YES/NO)': act.isMilestone ? 'YES' : 'NO',
    'Sort Order': act.sortOrder !== undefined ? act.sortOrder : index + 1
  }));

  // Fallback sample data using HCM-2026-011 if timelineRows is empty
  const defaultTimelineData = timelineRows.length > 0 ? timelineRows : [
    { 'No': 1, 'Activity Name': 'Requirement & Scope Freeze', 'Parent Activity': '', 'Phase': 'REQUIREMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-18', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 1 },
    { 'No': 2, 'Activity Name': 'Requirement Freeze', 'Parent Activity': 'Requirement & Scope Freeze', 'Phase': 'REQUIREMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-18', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 2 },
    { 'No': 3, 'Activity Name': 'Kick Off', 'Parent Activity': '', 'Phase': 'REQUIREMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-18', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 3 },
    { 'No': 4, 'Activity Name': 'FCAB', 'Parent Activity': '', 'Phase': 'FCAB', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-20', 'Duration Days': 3, 'Mandays': 3, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 4 },
    { 'No': 5, 'Activity Name': 'Submit FCAB', 'Parent Activity': 'FCAB', 'Phase': 'FCAB', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-19', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 5 },
    { 'No': 6, 'Activity Name': 'Approval FCAB', 'Parent Activity': 'FCAB', 'Phase': 'FCAB', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-20', 'End Date (YYYY-MM-DD)': '2026-05-20', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 6 },
    { 'No': 7, 'Activity Name': 'Design', 'Parent Activity': '', 'Phase': 'DESIGN', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-20', 'Duration Days': 3, 'Mandays': 3, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 7 },
    { 'No': 8, 'Activity Name': 'Pekerjaan UI / UX', 'Parent Activity': 'Design', 'Phase': 'DESIGN', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-18', 'End Date (YYYY-MM-DD)': '2026-05-19', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 8 },
    { 'No': 9, 'Activity Name': 'Pekerjaan Tech Architecture & ERD', 'Parent Activity': 'Design', 'Phase': 'DESIGN', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-19', 'End Date (YYYY-MM-DD)': '2026-05-20', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 9 },
    { 'No': 10, 'Activity Name': 'Development', 'Parent Activity': '', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-21', 'End Date (YYYY-MM-DD)': '2026-05-26', 'Duration Days': 6, 'Mandays': 6, 'Assigned Resource': 'Rayo', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 10 },
    { 'No': 11, 'Activity Name': 'Pengembangan Dashboard Job Person Matching', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-21', 'End Date (YYYY-MM-DD)': '2026-05-22', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Jansen', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 11 },
    { 'No': 12, 'Activity Name': 'Memunculkan Hasil PA - 4 semester Terakhir', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-20', 'End Date (YYYY-MM-DD)': '2026-05-20', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Dean', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 12 },
    { 'No': 13, 'Activity Name': 'Memunculkan Hasil PA - 4 semester Terakhir', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-22', 'End Date (YYYY-MM-DD)': '2026-05-22', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Jansen', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 13 },
    { 'No': 14, 'Activity Name': 'Menambahkan Kolom Gender', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-21', 'End Date (YYYY-MM-DD)': '2026-05-22', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Dean', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 14 },
    { 'No': 15, 'Activity Name': 'Menambahkan Kolom Gender', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-21', 'End Date (YYYY-MM-DD)': '2026-05-22', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Fazri', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 15 },
    { 'No': 16, 'Activity Name': 'Menambahkan Kolom Gender', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-21', 'End Date (YYYY-MM-DD)': '2026-05-22', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Tubagus', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 16 },
    { 'No': 17, 'Activity Name': 'Penyesuaian Periode IJP diganti dari Periode Menjadi Perbulan', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-25', 'End Date (YYYY-MM-DD)': '2026-05-25', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Jansen', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 17 },
    { 'No': 18, 'Activity Name': 'Penyesuaian  SJF', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '( Nambah 1 Filter Job Family, nambah 1 kolom Job Family , Check box SJF Semua Tab Job Person Matching Dashboard )', 'Start Date (YYYY-MM-DD)': '2026-05-25', 'End Date (YYYY-MM-DD)': '2026-05-26', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Dean', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 18 },
    { 'No': 19, 'Activity Name': 'Penyesuaian Detail History IJP', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': ' (Directoreate, Location , Band) ', 'Start Date (YYYY-MM-DD)': '2026-05-26', 'End Date (YYYY-MM-DD)': '2026-05-26', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Fazri', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 19 },
    { 'No': 20, 'Activity Name': 'Penyesuaian kolom Download Excel & CSV', 'Parent Activity': 'Development', 'Phase': 'DEVELOPMENT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-26', 'End Date (YYYY-MM-DD)': '2026-05-26', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Tubagus', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 20 },
    { 'No': 21, 'Activity Name': 'SIT', 'Parent Activity': '', 'Phase': 'SIT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-25', 'End Date (YYYY-MM-DD)': '2026-05-28', 'Duration Days': 3, 'Mandays': 3, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 21 },
    { 'No': 22, 'Activity Name': 'Create SRS', 'Parent Activity': '', 'Phase': 'SRS', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-26', 'End Date (YYYY-MM-DD)': '2026-05-28', 'Duration Days': 2, 'Mandays': 2, 'Assigned Resource': 'Sayyid', 'Progress (%)': 100, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 22 },
    { 'No': 23, 'Activity Name': 'FUT dan Deploy', 'Parent Activity': '', 'Phase': 'FUT', 'Feature': '', 'Sub Feature': '', 'Details': '', 'Start Date (YYYY-MM-DD)': '2026-05-29', 'End Date (YYYY-MM-DD)': '2026-05-29', 'Duration Days': 1, 'Mandays': 1, 'Assigned Resource': 'Rayo', 'Progress (%)': 0, 'Is Milestone (YES/NO)': 'NO', 'Sort Order': 23 }
  ];

  const timelineSheet = XLSX.utils.json_to_sheet(defaultTimelineData);
  
  // Set Column Widths for readability
  timelineSheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 45 }, // Activity Name
    { wch: 30 }, // Parent Activity
    { wch: 15 }, // Phase
    { wch: 20 }, // Feature
    { wch: 20 }, // Sub Feature
    { wch: 50 }, // Details
    { wch: 20 }, // Start Date
    { wch: 20 }, // End Date
    { wch: 15 }, // Duration
    { wch: 12 }, // Mandays
    { wch: 25 }, // Assigned Resource
    { wch: 15 }, // Progress
    { wch: 22 }, // Is Milestone
    { wch: 12 }, // Sort Order
  ];

  XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline');

  // 2. Map Resources to Sheet 2
  const defaultResourceRows = [
    { 'No': 1, 'Member Name': 'Sayyid', 'Role': 'Business Analyst', 'Email': 'sayyid@mii.co.id', 'Employee ID': 'EMP-SAYYID' },
    { 'No': 2, 'Member Name': 'Dean', 'Role': 'Developer Back-End', 'Email': 'dean@mii.co.id', 'Employee ID': 'EMP-DEAN' },
    { 'No': 3, 'Member Name': 'Fazri', 'Role': 'Developer Back-End', 'Email': 'fazri@mii.co.id', 'Employee ID': 'EMP-FAZRI' },
    { 'No': 4, 'Member Name': 'Jansen', 'Role': 'Developer Back-End', 'Email': 'jansen@mii.co.id', 'Employee ID': 'EMP-JANSEN' },
    { 'No': 5, 'Member Name': 'Tubagus', 'Role': 'Developer Back-End', 'Email': 'tubagus@mii.co.id', 'Employee ID': 'EMP-TUBAGUS' },
    { 'No': 6, 'Member Name': 'Rayo', 'Role': 'Technical Lead', 'Email': 'rayo@mii.co.id', 'Employee ID': 'EMP-RAYO' }
  ];

  const liveResourceRows = members.map((m, idx) => ({
    'No': idx + 1,
    'Member Name': m.user?.fullName || m.user?.email || 'N/A',
    'Role': m.role?.name || 'Resource',
    'Email': m.user?.email || '-',
    'Employee ID': m.user?.employeeId || m.memberId
  }));

  // Combine live project members and default HCM-2026-011 reference members to ensure a complete reference list
  const combinedResourceMap = new Map<string, any>();
  
  // Add live project members first
  liveResourceRows.forEach(row => {
    combinedResourceMap.set(row['Member Name'].toLowerCase(), row);
  });

  // Add default reference members if not already present
  defaultResourceRows.forEach(row => {
    if (!combinedResourceMap.has(row['Member Name'].toLowerCase())) {
      combinedResourceMap.set(row['Member Name'].toLowerCase(), row);
    }
  });

  const finalResourceRows = Array.from(combinedResourceMap.values()).map((row, idx) => ({
    ...row,
    'No': idx + 1
  }));

  const resourceSheet = XLSX.utils.json_to_sheet(finalResourceRows);

  resourceSheet['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 20 },
    { wch: 30 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(workbook, resourceSheet, 'Resources Reference');

  // 3. Export File
  const projectCodeFormatted = (project.projectCode || 'PROJECT').replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `Timeline_${projectCodeFormatted}_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

export interface ParseExcelResult {
  rows: ParsedExcelRow[];
  resourceRoles: Record<string, string>;
}

export function parseTimelineExcel(
  file: File,
  existingActivities: ProjectActivity[],
  _members?: ProjectMember[]
): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // 1. Pick first sheet for Timeline
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // 2. Parse Sheet 2 for Resources Reference if present
        const resourceRoles: Record<string, string> = {};
        if (workbook.SheetNames.length > 1) {
          const resourceSheetName = workbook.SheetNames[1];
          const resourceWorksheet = workbook.Sheets[resourceSheetName];
          const resourceJson: any[] = XLSX.utils.sheet_to_json(resourceWorksheet, { defval: '' });

          resourceJson.forEach(row => {
            const getResVal = (possibleKeys: string[]): string => {
              for (const key of Object.keys(row)) {
                if (possibleKeys.some(k => k.toLowerCase() === key.trim().toLowerCase())) {
                  return String(row[key] || '').trim();
                }
              }
              return '';
            };

            const memberName = getResVal(['Member Name', 'Name', 'Nama Member', 'Resource Name', 'Nama']);
            const roleName = getResVal(['Role', 'Peran', 'Jabatan']);

            if (memberName && roleName) {
              resourceRoles[memberName.toLowerCase()] = roleName;
            }
          });
        }

        const existingMap = new Map<string, ProjectActivity>();
        existingActivities.forEach(act => {
          existingMap.set(act.activityName.trim().toLowerCase(), act);
        });

        const parsedRows: ParsedExcelRow[] = jsonRows.map((row, idx) => {
          const errors: string[] = [];

          // Column resolution (case insensitive key lookup)
          const getVal = (possibleKeys: string[]): string => {
            for (const key of Object.keys(row)) {
              if (possibleKeys.some(k => k.toLowerCase() === key.trim().toLowerCase())) {
                return String(row[key] || '').trim();
              }
            }
            return '';
          };

          const activityName = getVal(['Activity Name', 'Nama Aktivitas', 'Task Name', 'Activity']);
          const parentName = getVal(['Parent Activity', 'Aktivitas Utama', 'Parent']);
          const phase = getVal(['Phase', 'Tahapan']);
          const feature = getVal(['Feature', 'Modul', 'Feature / Modul']);
          const subFeature = getVal(['Sub Feature', 'SubModul']);
          const details = getVal(['Details', 'Deskripsi', 'Detail']);
          
          let startDate = getVal(['Start Date (YYYY-MM-DD)', 'Start Date', 'Tanggal Mulai']);
          let endDate = getVal(['End Date (YYYY-MM-DD)', 'End Date', 'Tanggal Selesai']);

          // Format Date helper if Excel returned Date object string
          if (startDate && startDate.includes('T')) startDate = startDate.split('T')[0];
          if (endDate && endDate.includes('T')) endDate = endDate.split('T')[0];

          const durationDaysVal = getVal(['Duration Days', 'Duration', 'Durasi']);
          const durationDays = durationDaysVal ? Number(durationDaysVal) : undefined;

          const mandaysVal = getVal(['Mandays', 'Man Days']);
          const mandays = mandaysVal ? Number(mandaysVal) : undefined;

          const assignedToName = getVal(['Assigned Resource', 'Resource', 'Petugas', 'Assigned To']);
          
          const progressVal = getVal(['Progress (%)', 'Progress', 'Progress Pct']);
          const progressPct = progressVal !== '' ? Math.min(100, Math.max(0, Number(progressVal))) : 0;

          const milestoneVal = getVal(['Is Milestone (YES/NO)', 'Is Milestone', 'Milestone']).toUpperCase();
          const isMilestone = milestoneVal === 'YES' || milestoneVal === 'TRUE' || milestoneVal === '1' || milestoneVal === 'YA';

          const sortOrderVal = getVal(['Sort Order', 'Urutan']);
          const sortOrder = sortOrderVal ? Number(sortOrderVal) : idx + 1;

          if (!activityName) {
            errors.push('Nama Aktivitas tidak boleh kosong');
          }

          if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push('Tanggal Mulai tidak boleh melampaui Tanggal Selesai');
          }

          // Duplicate check
          const existing = existingMap.get(activityName.toLowerCase());

          return {
            rowIndex: idx + 2, // 1-based index + header line
            activityName,
            parentName,
            phase: phase || 'DEVELOPMENT',
            feature,
            subFeature,
            details,
            startDate,
            endDate,
            durationDays,
            mandays,
            assignedToName,
            progressPct,
            isMilestone,
            sortOrder,
            isDuplicate: Boolean(existing),
            existingActivityId: existing?.id,
            errors
          };
        });

        resolve({
          rows: parsedRows.filter(r => r.activityName !== ''),
          resourceRoles
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
