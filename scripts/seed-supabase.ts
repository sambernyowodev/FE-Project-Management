import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { rawProjects, rawTickets } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL is not defined in .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SECRET_KEY is not defined in .env. Admin operations (creating auth users) require a secret key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function parseDateString(str: string): string | null {
  if (!str || str.trim() === '' || str === '#NULL!') return null;

  // Replace Indonesian Month Names
  const cleaned = str
    .toLowerCase()
    .replace(/maret/g, 'mar')
    .replace(/mei/g, 'may')
    .replace(/\s+/g, '-');

  // Handle MM/DD/YYYY format
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const month = String(parseInt(parts[0], 10)).padStart(2, '0');
      const day = String(parseInt(parts[1], 10)).padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  const parts = cleaned.split('-');
  if (parts.length !== 3) return null;

  const day = String(parseInt(parts[0], 10)).padStart(2, '0');
  const monthStr = parts[1];
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;

  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const month = months[monthStr];
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

async function clearDatabase() {
  console.log('Clearing existing data (cascade)...');
  // Truncate tables in public schema cascade
  const { error } = await supabase.rpc('truncate_all_tables');
  if (error) {
    console.warn('Warning: RPC truncate_all_tables failed or does not exist. Attempting manual clean...', error.message);
    
    // Ordered to respect foreign key constraints
    const tables = [
      { name: 'support_ticket_assignees', filterCol: 'id' },
      { name: 'support_tickets', filterCol: 'id' },
      { name: 'billing_projects', filterCol: 'billing_id' },
      { name: 'billing_details', filterCol: 'id' },
      { name: 'billings', filterCol: 'id' },
      { name: 'po_members', filterCol: 'id' },
      { name: 'po_projects', filterCol: 'id' },
      { name: 'purchase_orders', filterCol: 'id' },
      { name: 'project_activities', filterCol: 'id' },
      { name: 'project_members', filterCol: 'id' },
      { name: 'projects', filterCol: 'id' },
      { name: 'master_projects', filterCol: 'id' },
      { name: 'member_roles', filterCol: 'id' },
      { name: 'members', filterCol: 'id' },
      { name: 'app_users', filterCol: 'id' },
      { name: 'role_rates', filterCol: 'id' },
      { name: 'roles', filterCol: 'id' }
    ];

    for (const table of tables) {
      const { error: delErr } = await supabase
        .from(table.name)
        .delete()
        .neq(table.filterCol, '00000000-0000-0000-0000-000000000000');

      if (delErr) {
        console.warn(`Warning: Failed to clear table ${table.name}:`, delErr.message);
      } else {
        console.log(`Cleared table: ${table.name}`);
      }
    }
  } else {
    console.log('Database cleared successfully via truncate_all_tables RPC.');
  }
}

async function seed() {
  console.log('--- Starting Supabase Seeding ---');

  // Check/create truncate RPC if not exists (we can do it directly via migrations, but we clean anyway)
  await clearDatabase();

  // 1. Seed Roles
  const roles = [
    { code: 'ADMIN', name: 'Administrator', description: 'System Administrator' },
    { code: 'PM', name: 'Project Manager', description: 'Project Manager' },
    { code: 'BA', name: 'Business Analyst', description: 'Business Analyst' },
    { code: 'UIUX', name: 'UI/UX Designer', description: 'UI/UX Designer' },
    { code: 'DEV_FE', name: 'Developer Front-End', description: 'Developer Front-End' },
    { code: 'DEV_BE', name: 'Developer Back-End', description: 'Developer Back-End' },
    { code: 'TL', name: 'Tech Lead', description: 'Technical Lead' },
    { code: 'QC', name: 'Quality Control', description: 'Quality Control / Tester' },
  ];

  console.log('Seeding Roles...');
  const { data: dbRoles, error: rolesErr } = await supabase.from('roles').insert(roles).select();
  if (rolesErr) {
    console.error('Failed to seed roles:', rolesErr);
    process.exit(1);
  }

  const roleMap = new Map<string, string>();
  dbRoles.forEach((r) => roleMap.set(r.code, r.id));

  // 2. Collect and Create Users (Members)
  // Gather all unique user names from seed data
  const userNames = new Set<string>();
  userNames.add('Admin');

  rawProjects.forEach((p) => {
    p.ba.forEach((n) => userNames.add(n));
    p.uiux.forEach((n) => userNames.add(n));
    p.fe.forEach((n) => userNames.add(n));
    p.be.forEach((n) => userNames.add(n));
  });

  rawTickets.forEach((t) => {
    if (t.businessAnalyst) userNames.add(t.businessAnalyst);
    if (t.uiUx) userNames.add(t.uiUx);
    if (t.devFe) userNames.add(t.devFe);
    if (t.devBe) userNames.add(t.devBe);
    if (t.details) {
      t.details.forEach((d) => {
        if (d.devBeNames) {
          d.devBeNames.split(',').forEach((name) => userNames.add(name.trim()));
        }
      });
    }
  });

  console.log(`Gathered ${userNames.size} unique user names.`);
  
  // List current auth users to clear them
  const { data: { users: existingAuthUsers }, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000
  });
  if (listErr) {
    console.error('Failed to list existing auth users:', listErr);
    process.exit(1);
  }

  // Delete all existing auth users
  console.log(`Clearing existing ${existingAuthUsers.length} auth users...`);
  for (const u of existingAuthUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (delErr) {
      console.warn(`Warning: Failed to delete user ${u.email}:`, delErr.message);
    }
  }

  // Create Portal Admins
  const adminsToCreate = [
    { email: 'admin@mii.co.id', fullName: 'Admin', role: 'ADMIN' },
    { email: 'Edy.Maradona@mii.co.id', fullName: 'Edy Maradona', role: 'ADMIN' },
    { email: 'Cerah.Prawastiyo@mii.co.id', fullName: 'Cerah Prawastiyo', role: 'ADMIN' },
    { email: 'rayo.wijaya@mii.co.id', fullName: 'Rayo Wijaya', role: 'ADMIN' }
  ];

  console.log('Registering portal administrators in Supabase Auth...');
  for (const adm of adminsToCreate) {
    const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
      email: adm.email,
      password: 'Password123',
      email_confirm: true,
      user_metadata: { 
        full_name: adm.fullName,
        role: adm.role
      },
    });

    if (createErr) {
      console.error(`Failed to create admin user ${adm.fullName} (${adm.email}):`, createErr.message);
    } else {
      console.log(`Created admin user: ${adm.fullName} (${adm.email})`);
    }
  }

  const memberMap = new Map<string, string>(); // name -> memberUUID

  console.log(`Seeding ${userNames.size} members directly to database...`);
  for (const name of userNames) {
    if (!name || name.trim() === '' || name.toLowerCase() === 'tsel' || name.toLowerCase() === 'internship') continue;
    const cleanName = name.trim();
    const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@mii.co.id`;
    const employeeId = `EMP-${cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 50);

    const { data: memberRecord, error: memberErr } = await supabase.from('members').insert({
      email,
      full_name: cleanName,
      employee_id: employeeId,
      is_active: true,
    }).select().single();

    if (memberErr) {
      console.error(`Failed to seed member resource for ${cleanName}:`, memberErr.message);
      continue;
    }

    memberMap.set(cleanName, memberRecord.id);

    // Assign default role based on where they appear in member_roles (formerly user_roles)
    let assignedRole = 'DEV_BE'; // Default role
    if (cleanName === 'Admin') assignedRole = 'ADMIN';
    else if (rawProjects.some((p) => p.ba.includes(cleanName))) assignedRole = 'BA';
    else if (rawProjects.some((p) => p.uiux.includes(cleanName))) assignedRole = 'UIUX';
    else if (rawProjects.some((p) => p.fe.includes(cleanName))) assignedRole = 'DEV_FE';

    const roleId = roleMap.get(assignedRole);
    if (roleId) {
      await supabase.from('member_roles').insert({
        member_id: memberRecord.id,
        role_id: roleId,
      });
    }
  }

  // 3. Seed Projects & Master Projects
  console.log('Seeding projects...');
  const countsByYear: Record<number, number> = {};
  const projectMap = new Map<string, string>(); // project name -> projectUUID
  const masterProjectMap = new Map<string, string>(); // master project name -> masterProjectUUID

  for (const raw of rawProjects) {
    const startDate = parseDateString(raw.startDate);
    const endDate = parseDateString(raw.endDate);
    const year = startDate ? new Date(startDate).getFullYear() : 2025;
    
    countsByYear[year] = (countsByYear[year] || 0) + 1;
    const projectCode = `HCM-${year}-${String(countsByYear[year]).padStart(3, '0')}`;

    // Map status
    let status = 'CLOSED';
    const cleanStatus = raw.status.trim().toUpperCase().replace(/\s+/g, '_');
    if (cleanStatus === 'FUT') status = 'FUT';
    else if (['PLANNING', 'ON_PLANNING', 'ON_ASSESSMENT', 'DOCUMENTATION'].includes(cleanStatus)) status = 'PLANNING';
    else if (['IN_PROGRESS', 'ON_PROGRESS_DEVELOPMENT'].includes(cleanStatus)) status = 'IN PROGRESS';
    else if (cleanStatus === 'SIT') status = 'SIT';
    else if (['UAT', 'PENTEST'].includes(cleanStatus)) status = 'UAT';
    else if (cleanStatus === 'ON_HOLD') status = 'ON HOLD';
    else if (cleanStatus === 'CANCELLED') status = 'CANCELLED';

    // Create Master Project
    const { data: masterProj, error: mpErr } = await supabase.from('master_projects').insert({
      project_code: projectCode,
      name: raw.name,
      description: raw.description,
      platform: raw.platform,
      is_active: true,
    }).select().single();

    if (mpErr) {
      console.error(`Failed to create master project ${raw.name}:`, mpErr);
      continue;
    }

    masterProjectMap.set(raw.name, masterProj.id);

    // Create Project
    const { data: proj, error: pErr } = await supabase.from('projects').insert({
      project_id: masterProj.id,
      pic_client: raw.picClient,
      customer: 'Telkomsel HCM',
      status: status,
      total_mandays: raw.mandays,
      start_date: startDate,
      end_date: endDate,
      remarks: raw.remarks,
      is_active: true,
      repository_link: raw.repositoryLink || null,
      timeline_link: raw.timelineLink || null,
    }).select().single();

    if (pErr) {
      console.error(`Failed to create project ${raw.name}:`, pErr);
      continue;
    }

    projectMap.set(raw.name, proj.id);

    // Create Purchase Order if applicable
    let poId: string | null = null;
    const hasRealPO = raw.po && raw.po !== 'X-PO-XXX' && raw.po.trim() !== '';
    if (hasRealPO) {
      const { data: existingPo, error: selectErr } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('po_number', raw.po)
        .maybeSingle();

      if (selectErr) {
        console.error(`Error querying existing PO ${raw.po}:`, selectErr.message);
      }

      if (existingPo) {
        poId = existingPo.id;
      } else {
        const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
          po_number: raw.po,
          po_name: `PO - ${raw.name}`,
          customer: 'Telkomsel HCM',
          description: raw.description,
          total_mandays: raw.mandays,
          status: 'CLOSED',
          start_date: startDate,
          end_date: endDate,
          is_active: true,
        }).select().single();

        if (poErr) {
          console.warn(`Warning: Failed to create PO ${raw.po}:`, poErr.message);
          // If creation failed (potentially due to a race or constraint), try querying it once more
          const { data: retryPo, error: retryErr } = await supabase
            .from('purchase_orders')
            .select('id')
            .eq('po_number', raw.po)
            .maybeSingle();
          
          if (retryPo) {
            poId = retryPo.id;
            console.log(`Successfully recovered PO ${raw.po} ID on retry: ${poId}`);
          } else if (retryErr) {
            console.error(`Failed retry querying PO ${raw.po}:`, retryErr.message);
          }
        } else if (po) {
          poId = po.id;
        }
      }

      if (poId) {
        // PoProject link
        const { error: poProjErr } = await supabase.from('po_projects').insert({
          po_id: poId,
          project_id: proj.id,
          allocated_mandays: raw.mandays,
          remarks: 'Seeded assignment',
        });
        if (poProjErr) {
          console.warn(`Warning: Failed to link PO project:`, poProjErr.message);
        }
      }
    }

    // Helper for inserting project members
    const assignProjectMembers = async (names: string[], roleCode: string) => {
      const roleId = roleMap.get(roleCode);
      if (!roleId) return;

      for (const name of names) {
        const memberId = memberMap.get(name);
        if (!memberId) continue;

        const { data: memberRecord, error: mErr } = await supabase.from('project_members').insert({
          project_id: proj.id,
          member_id: memberId,
          role_id: roleId,
          assigned_mandays: 0,
          actual_mandays: 0,
          is_active: true,
        }).select().single();

        if (mErr) {
          console.error(`Failed to assign ${name} as ${roleCode} to project ${raw.name}:`, mErr.message);
        } else if (poId && memberRecord) {
          // PoMember link
          await supabase.from('po_members').insert({
            po_id: poId,
            project_member_id: memberRecord.id,
            role_id: roleId,
            actual_mandays: 0,
            actual_hours: 0,
            rate_per_manday: 0,
            total_cost: 0,
            start_date: startDate,
            end_date: endDate,
            is_billable: true,
          });
        }
      }
    };

    await assignProjectMembers(raw.ba, 'BA');
    await assignProjectMembers(raw.uiux, 'UIUX');
    await assignProjectMembers(raw.fe, 'DEV_FE');
    await assignProjectMembers(raw.be, 'DEV_BE');
  }

  // 4. Seed Support Tickets
  console.log('Seeding support tickets...');
  let supportIndex = 1;

  for (const raw of rawTickets) {
    const startDate = parseDateString(raw.startDate);
    const endDate = parseDateString(raw.endDate);
    const updateDate = raw.updateDate ? parseDateString(raw.updateDate) : null;
    const year = startDate ? new Date(startDate).getFullYear() : 2025;
    const ticketCode = `SUP-${year}-${String(supportIndex++).padStart(4, '0')}`;

    // Resolve master project or create if missing
    let masterProjectId = masterProjectMap.get(raw.projectName);
    if (!masterProjectId) {
      // Attempt generic match
      const matchedName = Array.from(masterProjectMap.keys()).find(
        (name) => name.toLowerCase().includes(raw.projectName.toLowerCase()) || raw.projectName.toLowerCase().includes(name.toLowerCase())
      );
      if (matchedName) {
        masterProjectId = masterProjectMap.get(matchedName);
      }
    }

    if (!masterProjectId) {
      // Create master project automatically
      countsByYear[year] = (countsByYear[year] || 0) + 1;
      const projectCode = `HCM-${year}-${String(countsByYear[year]).padStart(3, '0')}`;

      const { data: newMaster, error: mErr } = await supabase.from('master_projects').insert({
        project_code: projectCode,
        name: raw.projectName,
        description: `Created automatically during support ticket seeding for ${raw.projectName}`,
        platform: raw.platform || 'OS',
        is_active: true,
      }).select().single();

      if (mErr) {
        console.error(`Failed to create master project for ticket ${raw.projectName}:`, mErr.message);
        continue;
      }
      masterProjectId = newMaster.id;
      masterProjectMap.set(raw.projectName, newMaster.id);

      // Corresponding project
      const { data: newProj } = await supabase.from('projects').insert({
        project_id: newMaster.id,
        pic_client: raw.customer || 'Unknown Client',
        customer: 'Telkomsel HCM',
        status: 'IN PROGRESS',
        total_mandays: Number((raw.hours / 8).toFixed(2)),
        start_date: startDate,
        end_date: endDate,
        remarks: raw.notes || `Created for Support Ticket Seeding`,
        is_active: true,
      }).select().single();
      if (newProj) {
        projectMap.set(raw.projectName, newProj.id);
      }
    }

    // Map ticket status
    let ticketStatus = 'OPEN';
    const cleanTicketStatus = raw.status.trim().toUpperCase();
    if (cleanTicketStatus === 'DONE') ticketStatus = 'DONE';
    else if (cleanTicketStatus === 'SIT DONE') ticketStatus = 'SIT DONE';
    else if (['ON PROGRESS DEVELOPMENT', 'IN PROGRESS'].includes(cleanTicketStatus)) ticketStatus = 'IN PROGRESS';
    else if (cleanTicketStatus === 'ON HOLD') ticketStatus = 'ON HOLD';
    else if (cleanTicketStatus === 'CANCELLED') ticketStatus = 'CANCELLED';

    // Insert support ticket
    const { data: ticket, error: ticketErr } = await supabase.from('support_tickets').insert({
      ticket_code: ticketCode,
      master_project_id: masterProjectId,
      customer: 'Telkomsel HCM',
      pic_client: raw.customer || null,
      issue_title: raw.issue,
      issue_description: raw.issue,
      hours_spent: raw.hours,
      mandays_spent: Number((raw.hours / 8).toFixed(2)),
      status: ticketStatus,
      start_date: startDate,
      end_date: endDate,
      folder_attachment: raw.attachments || null,
      notes: raw.notes || null,
      update_date: updateDate,
      is_active: true,
    }).select().single();

    if (ticketErr) {
      console.error(`Failed to create support ticket ${ticketCode}:`, ticketErr.message);
      continue;
    }

    // Gather assignees
    const assignees: { name: string; role: string }[] = [];
    if (raw.businessAnalyst) assignees.push({ name: raw.businessAnalyst, role: 'BA' });
    if (raw.uiUx) assignees.push({ name: raw.uiUx, role: 'UIUX' });
    if (raw.devFe) assignees.push({ name: raw.devFe, role: 'DEV_FE' });
    if (raw.devBe) assignees.push({ name: raw.devBe, role: 'DEV_BE' });

    if (raw.details) {
      raw.details.forEach((d) => {
        if (d.devBeNames) {
          d.devBeNames.split(',').forEach((n) => {
            if (!assignees.some((a) => a.name === n.trim())) {
              assignees.push({ name: n.trim(), role: 'DEV_BE' });
            }
          });
        }
      });
    }

    for (const assignee of assignees) {
      const memberId = memberMap.get(assignee.name);
      const roleId = roleMap.get(assignee.role);
      if (!memberId || !roleId) continue;

      const { error: aErr } = await supabase.from('support_ticket_assignees').insert({
        support_ticket_id: ticket.id,
        member_id: memberId,
        role_id: roleId,
        hours_spent: Number((raw.hours / (assignees.length || 1)).toFixed(2)),
        status: ticketStatus === 'DONE' ? 'DONE' : 'OPEN',
        start_date: startDate,
        end_date: endDate,
      });

      if (aErr) {
        console.error(`  Failed to assign ${assignee.name} to ticket ${ticketCode}:`, aErr.message);
      }
    }
  }

  console.log('\n--- Supabase Seeding Completed Successfully ---');
}

seed().catch((err) => {
  console.error('Seeder execution failed:', err);
  process.exit(1);
});
