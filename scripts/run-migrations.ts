/**
 * Direct Migration Runner
 * Executes migration files directly against Supabase database
 * Uses the connection string from environment variables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const MIGRATIONS = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_realtime_setup.sql',
  '004_session_cleanup.sql',
  '005_update_rls_for_cleanup.sql',
  '006_add_authentication.sql',
];

interface MigrationResult {
  filename: string;
  success: boolean;
  message: string;
}

async function executeSqlFile(filename: string): Promise<MigrationResult> {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return {
      filename,
      success: false,
      message: 'File not found',
    };
  }

  console.log(`\n📝 Executing ${filename}...`);
  const sql = fs.readFileSync(filePath, 'utf-8');

  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.match(/^--/));

  let executed = 0;
  let failed = 0;

  for (const statement of statements) {
    // Skip comments and empty lines
    if (statement.startsWith('--') || statement.trim().length === 0) {
      continue;
    }

    try {
      // Try to execute via rpc
      const { error } = await supabase.rpc('exec_sql' as any, {
        sql: statement + ';',
      });

      if (error) {
        console.error(`   ⚠️  Statement failed: ${error.message.substring(0, 100)}...`);
        failed++;
      } else {
        executed++;
      }
    } catch (err: any) {
      console.error(`   ⚠️  Error: ${err.message?.substring(0, 100)}`);
      failed++;
    }
  }

  const success = failed === 0;
  console.log(
    `   ${success ? '✅' : '⚠️'}  Executed ${executed}/${statements.length} statements`
  );

  return {
    filename,
    success,
    message: success
      ? `Success (${executed} statements)`
      : `Partial success (${executed} succeeded, ${failed} failed)`,
  };
}

async function main() {
  console.log('🚀 Running Database Migrations...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  NOTE: This script has limited permissions.');
  console.log('   Some migrations may need to be run via Supabase SQL Editor.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: MigrationResult[] = [];

  for (const migration of MIGRATIONS) {
    const result = await executeSqlFile(migration);
    results.push(result);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 SUMMARY\n');

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((r) => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.filename}: ${r.message}`);
  });

  console.log(`\n   Total: ${successful} successful, ${failed} failed\n`);

  if (failed > 0) {
    console.log('⚠️  Some migrations failed or had errors.\n');
    console.log('💡 RECOMMENDED: Run migrations via Supabase SQL Editor:\n');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy/paste each migration file from supabase/migrations/');
    console.log('   3. Run each migration manually\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }

  console.log('✅ All migrations completed!\n');
  console.log('Next step: npm run verify-migrations\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
