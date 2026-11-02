import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase');

  // Recreate audit_logs table to match AuditLog entity
  await client.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
  await client.query(`
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor VARCHAR NOT NULL DEFAULT 'Admin',
      action VARCHAR NOT NULL,
      category VARCHAR NOT NULL DEFAULT 'GENERAL',
      "targetEntity" VARCHAR NOT NULL,
      details TEXT NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'SUCCESS',
      "ipAddress" VARCHAR,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ audit_logs table created');

  // Ensure bills has customerName column
  await client.query(`
    ALTER TABLE bills ADD COLUMN IF NOT EXISTS "customerName" VARCHAR
  `);
  console.log('✅ bills.customerName ensured');

  // Ensure support_tickets has all entity columns
  await client.query(`
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "customerAddress" VARCHAR;
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "deviceId" VARCHAR;
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMPTZ;
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMPTZ;
    ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMPTZ;
  `);
  console.log('✅ support_tickets columns verified');

  await client.end();
  console.log('DONE!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
