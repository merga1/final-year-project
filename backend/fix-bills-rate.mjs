// Fix missing 'rate' column in bills table
// Uses transaction pooler (port 6543) to avoid EMAXCONNSESSION
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected via transaction pooler');

  // Add missing rate column
  await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS rate real NOT NULL DEFAULT 5`);
  console.log('Added rate column (or it already existed)');

  // Show current bills schema
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'bills'
    ORDER BY ordinal_position
  `);
  console.log('\nbills table schema:');
  console.table(res.rows);

  await client.end();
  console.log('\nDone!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
