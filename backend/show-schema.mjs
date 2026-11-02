import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
const tables = ['bills', 'users', 'water_meters', 'alerts', 'support_tickets', 'audit_logs', 'payments', 'technicians'];
for (const t of tables) {
  const r = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [t]
  );
  console.log(`\n=== ${t} ===`);
  r.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
}
await client.end();
