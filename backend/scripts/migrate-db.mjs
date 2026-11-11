import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Applying missing column migrations...');

  await client.query(`
    ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean DEFAULT true;
    ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "latitude" real;
    ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "longitude" real;
  `);

  console.log('Migration applied successfully!');

  // Check columns now
  const tech = await client.query('select column_name from information_schema.columns where table_name = $1', ['technicians']);
  console.log('Updated Technicians columns:', tech.rows.map(r => r.column_name).filter(c => c === 'mustChangePassword'));

  const dev = await client.query('select column_name from information_schema.columns where table_name = $1', ['devices']);
  console.log('Updated Devices columns:', dev.rows.map(r => r.column_name).filter(c => c === 'latitude' || c === 'longitude'));

  await client.end();
}

main().catch(console.error);
