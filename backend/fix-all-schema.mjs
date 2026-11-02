import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.qgjnfvpnjavztraelynf:14383814Bm.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
await client.connect();
console.log('Connected');

// Fix bills table: add periodStart, periodEnd aliases (TypeORM entity uses these names)
// The DB has billingPeriodStart/billingPeriodEnd - we'll add the columns the entity expects
await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS "periodStart" text`);
await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS "periodEnd" text`);
// Backfill from existing columns
await client.query(`UPDATE bills SET "periodStart" = "billingPeriodStart"::text WHERE "periodStart" IS NULL AND "billingPeriodStart" IS NOT NULL`);
await client.query(`UPDATE bills SET "periodEnd" = "billingPeriodEnd"::text WHERE "periodEnd" IS NULL AND "billingPeriodEnd" IS NOT NULL`);
console.log('Fixed bills: added periodStart, periodEnd');

// Fix payments table: entity has customerName, amount columns
await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "customerName" character varying`);
await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "amount" double precision`);
// Backfill amount from amountEtb
await client.query(`UPDATE payments SET "amount" = "amountEtb" WHERE "amount" IS NULL`);
console.log('Fixed payments: added customerName, amount');

// Fix alerts table: entity has acknowledged, acknowledgedBy columns
await client.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS "acknowledged" boolean DEFAULT false`);
await client.query(`ALTER TABLE alerts ADD COLUMN IF NOT EXISTS "acknowledgedBy" character varying`);
// Sync with status column
await client.query(`UPDATE alerts SET "acknowledged" = true WHERE status = 'resolved' AND "acknowledged" IS NULL`);
console.log('Fixed alerts: added acknowledged, acknowledgedBy');

// Fix technicians: entity has accountStatus, specialization, qualifications, hireDate, address, currentJobCount, completedRepairs
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "accountStatus" character varying DEFAULT 'active'`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "specialization" character varying DEFAULT 'No specialization'`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "qualifications" character varying`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "hireDate" character varying`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "address" character varying`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "currentJobCount" integer DEFAULT 0`);
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "completedRepairs" integer DEFAULT 0`);
// name column: technicians table has firstName+lastName but entity also has name
await client.query(`ALTER TABLE technicians ADD COLUMN IF NOT EXISTS "name" character varying`);
await client.query(`UPDATE technicians SET "name" = COALESCE("name", CONCAT("firstName", ' ', "lastName")) WHERE "name" IS NULL`);
console.log('Fixed technicians: added missing columns');

// Fix support_tickets: entity has customerName, technicianId, technicianName, type, issue, notes, progressNotes, rejectionReason, statusHistory
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "customerName" character varying DEFAULT 'Customer'`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "technicianId" text`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "technicianName" text`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "type" character varying DEFAULT 'SENSOR'`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "issue" character varying DEFAULT 'General support'`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "notes" character varying`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "progressNotes" text`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "rejectionReason" text`);
await client.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS "statusHistory" text`);
// Sync from existing columns
await client.query(`UPDATE support_tickets SET "technicianId" = "assignedTechnicianId" WHERE "technicianId" IS NULL AND "assignedTechnicianId" IS NOT NULL`);
await client.query(`UPDATE support_tickets SET "issue" = COALESCE("subject", 'General support') WHERE "issue" = 'General support' AND "subject" IS NOT NULL`);
console.log('Fixed support_tickets: added missing columns');

// Create devices table if not exists
await client.query(`
  CREATE TABLE IF NOT EXISTS devices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "meterId" character varying NOT NULL UNIQUE,
    "customerId" character varying,
    zone character varying DEFAULT 'Zone A',
    connectivity character varying DEFAULT 'ONLINE',
    "valveState" character varying DEFAULT 'OPEN',
    "batteryPercent" real DEFAULT 100,
    "lastSeenAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now()
  )
`);
console.log('Ensured devices table exists');

// Create device_readings table if not exists
await client.query(`
  CREATE TABLE IF NOT EXISTS device_readings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "deviceId" character varying NOT NULL,
    "meterId" character varying NOT NULL,
    "flowRateLpm" real DEFAULT 0,
    "totalUsageLiters" real DEFAULT 0,
    "turbidityNtu" real DEFAULT 0,
    "valveState" character varying DEFAULT 'OPEN',
    connectivity character varying DEFAULT 'ONLINE',
    "batteryPercent" real DEFAULT 100,
    "timestamp" timestamp with time zone DEFAULT now()
  )
`);
console.log('Ensured device_readings table exists');

// Create valve_commands table if not exists
await client.query(`
  CREATE TABLE IF NOT EXISTS valve_commands (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "customerId" character varying NOT NULL,
    "meterId" character varying NOT NULL,
    "requestedState" character varying NOT NULL,
    status character varying DEFAULT 'confirmed',
    "confirmedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now()
  )
`);
console.log('Ensured valve_commands table exists');

// Create notifications table if not exists  
await client.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" character varying NOT NULL,
    audience character varying DEFAULT 'customer',
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    "relatedId" character varying,
    read boolean DEFAULT false,
    "createdAt" timestamp with time zone DEFAULT now()
  )
`);
console.log('Ensured notifications table exists');

await client.end();
console.log('\n✅ All schema fixes applied!');
