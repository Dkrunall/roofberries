// One-off script to create the first admin/kitchen login.
// The app itself has no sign-up flow on purpose (admin_users has no
// insert policy reachable from anon/authenticated — see
// supabase/migrations/0002_rls.sql) — this script uses the service role
// key to do it instead.
//
// Usage:
//   node scripts/create-admin.js owner@opabar.com "a-strong-password" manager
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to be set
// (e.g. `npx dotenv -e .env.local -- node scripts/create-admin.js ...`).

const { createClient } = require('@supabase/supabase-js');

const [, , email, password, role = 'manager'] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [manager|kitchen]');
  process.exit(1);
}
if (!['manager', 'kitchen'].includes(role)) {
  console.error('role must be "manager" or "kitchen"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;

  const { error: insertErr } = await supabase
    .from('admin_users')
    .insert({ id: created.user.id, email, role });
  if (insertErr) throw insertErr;

  console.log(`Created ${role} admin: ${email}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
