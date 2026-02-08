/**
 * Migration Application Script
 *
 * Applies database migrations programmatically
 * NOTE: This requires a SERVICE_ROLE key (not the anon key)
 *
 * Usage: npm run apply-migrations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('');
  console.error('⚠️  WARNING: The service role key has admin privileges!');
  console.error('   Get it from: Supabase Dashboard > Settings > API > service_role key');
  console.error('   Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.error('   NEVER commit this key to version control!');
  console.error('');
  console.error('💡 Alternative: Apply migrations manually via Supabase SQL Editor');
  console.error('   Go to: Supabase Dashboard > SQL Editor');
  console.error('   Copy/paste each migration file from supabase/migrations/');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const MIGRATIONS = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_realtime_setup.sql',
  '004_session_cleanup.sql',
  '005_update_rls_for_cleanup.sql',
  '006_add_authentication.sql',
];

async function applyMigration(filename: string): Promise<boolean> {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename}: File not found, skipping`);
    return true;
  }

  console.log(`📝 Applying ${filename}...`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      // Note: This won't work with anon key, needs service role
      console.error(`   ❌ Error: ${error.message}`);
      console.error('');
      console.error('   💡 Tip: Some migrations need to be run via Supabase SQL Editor');
      console.error(`      Copy the contents of ${filename} and paste into SQL Editor`);
      return false;
    }

    console.log(`   ✅ Success`);
    return true;
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message || err}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Database Migrations...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let successCount = 0;
  let failCount = 0;

  for (const migration of MIGRATIONS) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 SUMMARY');
  console.log(`   Applied: ${successCount}/${MIGRATIONS.length}`);
  console.log(`   Failed: ${failCount}`);
  console.log('');

  if (failCount > 0) {
    console.log('⚠️  Some migrations failed to apply.');
    console.log('');
    console.log('💡 Recommended approach:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy/paste each migration file manually');
    console.log('   3. Run: npm run verify-migrations');
    console.log('');
    process.exit(1);
  }

  console.log('✅ All migrations applied successfully!');
  console.log('');
  console.log('Next step: npm run verify-migrations');
  console.log('');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
