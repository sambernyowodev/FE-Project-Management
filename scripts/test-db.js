import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

console.log('Supabase URL:', url);

async function testConnection() {
  // Test 1: With Anonymous Key (similar to logged-out frontend)
  const clientAnon = createClient(url, anonKey);
  console.log('\n--- TESTING WITH ANON KEY ---');
  
  const { data: rolesAnon, error: rErrAnon } = await clientAnon.from('roles').select('id, name');
  console.log('Roles Count (Anon):', rolesAnon ? rolesAnon.length : 'Error or Null', rErrAnon || '');

  const { data: projectsAnon, error: pErrAnon } = await clientAnon.from('projects').select('id');
  console.log('Projects Count (Anon):', projectsAnon ? projectsAnon.length : 'Error or Null', pErrAnon || '');

  // Test 2: With Service Role Key (bypasses RLS to verify if data actually exists)
  const clientService = createClient(url, serviceKey);
  console.log('\n--- TESTING WITH SERVICE ROLE KEY (BYPASS RLS) ---');
  
  const { data: rolesServ, error: rErrServ } = await clientService.from('roles').select('id, name');
  console.log('Roles Count (Service):', rolesServ ? rolesServ.length : 'Error or Null', rErrServ || '');

  const { data: membersServ, error: mErrServ } = await clientService.from('members').select('id, full_name');
  console.log('Members Count (Service):', membersServ ? membersServ.length : 'Error or Null', mErrServ || '');

  const { data: masterProjectsServ, error: mpErrServ } = await clientService.from('master_projects').select('id, name');
  console.log('Master Projects Count (Service):', masterProjectsServ ? masterProjectsServ.length : 'Error or Null', mpErrServ || '');

  const { data: projectsServ, error: pErrServ } = await clientService.from('projects').select('id');
  console.log('Projects Count (Service):', projectsServ ? projectsServ.length : 'Error or Null', pErrServ || '');

  const { data: ticketsServ, error: tErrServ } = await clientService.from('support_tickets').select('id');
  console.log('Support Tickets Count (Service):', ticketsServ ? ticketsServ.length : 'Error or Null', tErrServ || '');

  const { data: appUsersServ, error: auErrServ } = await clientService.from('app_users').select('id, email, role');
  console.log('App Users Count (Service):', appUsersServ ? appUsersServ.length : 'Error or Null', auErrServ || '');
  console.log('App Users:', appUsersServ);
}

testConnection().catch(console.error);
