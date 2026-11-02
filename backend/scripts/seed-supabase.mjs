/**
 * Direct PostgreSQL seed script for Supabase.
 * Bypasses TypeORM — uses pg client directly to avoid ESM/CJS issues.
 * Run: node scripts/seed-supabase.mjs
 */
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:14383814Bm.@db.qgjnfvpnjavztraelynf.supabase.co:5432/postgres';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL');

  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);
  const technicianHash = await bcrypt.hash('technician123', 10);

  // Create tables if not exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      "firstName" VARCHAR,
      "lastName" VARCHAR,
      email VARCHAR UNIQUE NOT NULL,
      "passwordHash" VARCHAR NOT NULL,
      "dateOfBirth" VARCHAR,
      address VARCHAR,
      "meterId" VARCHAR UNIQUE,
      zone VARCHAR DEFAULT 'Zone A',
      role VARCHAR DEFAULT 'customer',
      "accountStatus" VARCHAR DEFAULT 'active',
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS technicians (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      "firstName" VARCHAR,
      "lastName" VARCHAR,
      email VARCHAR UNIQUE NOT NULL,
      "passwordHash" VARCHAR NOT NULL,
      phone VARCHAR,
      zone VARCHAR DEFAULT 'Zone A',
      status VARCHAR DEFAULT 'available',
      "skillLevel" VARCHAR DEFAULT 'junior',
      "totalJobsCompleted" INTEGER DEFAULT 0,
      "averageRating" FLOAT DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "meterId" VARCHAR UNIQUE NOT NULL,
      "customerId" VARCHAR,
      zone VARCHAR DEFAULT 'Zone A',
      connectivity VARCHAR DEFAULT 'ONLINE',
      "valveState" VARCHAR DEFAULT 'OPEN',
      "batteryPercent" FLOAT DEFAULT 100,
      "lastSeenAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS device_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "deviceId" VARCHAR NOT NULL,
      "meterId" VARCHAR NOT NULL,
      "flowRateLpm" FLOAT DEFAULT 0,
      "totalUsageLiters" FLOAT DEFAULT 0,
      "turbidityNtu" FLOAT DEFAULT 0,
      "valveState" VARCHAR DEFAULT 'OPEN',
      connectivity VARCHAR DEFAULT 'ONLINE',
      "batteryPercent" FLOAT DEFAULT 100,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bills (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "customerId" VARCHAR NOT NULL,
      "billingPeriodStart" TIMESTAMPTZ,
      "billingPeriodEnd" TIMESTAMPTZ,
      "usageLiters" FLOAT DEFAULT 0,
      "amountEtb" FLOAT DEFAULT 0,
      status VARCHAR DEFAULT 'unpaid',
      "dueDate" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "customerId" VARCHAR NOT NULL,
      "billId" VARCHAR,
      "amountEtb" FLOAT NOT NULL,
      method VARCHAR DEFAULT 'cash',
      status VARCHAR DEFAULT 'completed',
      reference VARCHAR,
      "paidAt" TIMESTAMPTZ DEFAULT NOW(),
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR NOT NULL,
      severity VARCHAR DEFAULT 'medium',
      message VARCHAR NOT NULL,
      "deviceId" VARCHAR,
      "meterId" VARCHAR,
      "customerId" VARCHAR,
      status VARCHAR DEFAULT 'open',
      "resolvedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "customerId" VARCHAR NOT NULL,
      "assignedTechnicianId" VARCHAR,
      subject VARCHAR NOT NULL,
      description VARCHAR,
      status VARCHAR DEFAULT 'open',
      priority VARCHAR DEFAULT 'medium',
      "resolvedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "recipientId" VARCHAR NOT NULL,
      "recipientRole" VARCHAR DEFAULT 'customer',
      title VARCHAR NOT NULL,
      message VARCHAR NOT NULL,
      type VARCHAR DEFAULT 'info',
      "isRead" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS valve_commands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "deviceId" VARCHAR NOT NULL,
      "meterId" VARCHAR NOT NULL,
      command VARCHAR NOT NULL,
      "issuedBy" VARCHAR,
      status VARCHAR DEFAULT 'pending',
      "executedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "adminId" VARCHAR,
      action VARCHAR NOT NULL,
      "entityType" VARCHAR,
      "entityId" VARCHAR,
      "oldValue" TEXT,
      "newValue" TEXT,
      "ipAddress" VARCHAR,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tables created/verified');

  // Clear data
  await client.query(`TRUNCATE support_tickets, payments, bills, alerts, notifications, valve_commands, device_readings, devices, technicians, customers RESTART IDENTITY CASCADE`);
  console.log('🧹 Cleared existing data');

  // Seed Admins
  const admin1 = await client.query(
    `INSERT INTO customers (name, "firstName", "lastName", email, "passwordHash", role, zone, "accountStatus") 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    ['Yo 2', 'Yo', '2', 'admin2@gmail.com', adminHash, 'admin', 'HQ', 'active']
  );
  await client.query(
    `INSERT INTO customers (name, "firstName", "lastName", email, "passwordHash", role, zone, "accountStatus") 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['System Admin', 'System', 'Admin', 'admin@admin.water', adminHash, 'admin', 'HQ', 'active']
  );
  console.log('✅ Admins seeded');

  // Seed Customers
  const customers = [
    ['Saikim Remiy', 'Saikim', 'Remiy', 'mikiasylmer7362@gmail.com', customerHash, 'ESP32-001', 'Zone A', 'active', 'Bole Subcity, House 412', '1996-04-12'],
    ['mike garedew', 'mike', 'garedew', 'mikegar@gmail.com', customerHash, 'ESP32-018', 'Zone B', 'active', 'Yeka Subcity, House 109', '1994-09-21'],
    ['MIKIAS ABEGAZ', 'MIKIAS', 'ABEGAZ', 'customer@gmail.com', customerHash, 'ESP32-042', 'Zone C', 'active', 'Kirkos Subcity, House 220', '1990-11-03'],
    ['Abel Tesfaye', 'Abel', 'Tesfaye', 'abel@gmail.com', customerHash, 'ESP32-007', 'Zone A', 'suspended', 'Nifas Silk, House 55', '1998-07-19'],
  ];
  const customerIds = [];
  for (const c of customers) {
    const r = await client.query(
      `INSERT INTO customers (name, "firstName", "lastName", email, "passwordHash", "meterId", zone, "accountStatus", address, "dateOfBirth") 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      c
    );
    customerIds.push(r.rows[0].id);
  }
  console.log('✅ Customers seeded');

  // Seed Technicians
  await client.query(
    `INSERT INTO technicians (name, "firstName", "lastName", email, "passwordHash", phone, zone, status, "skillLevel", "totalJobsCompleted", "averageRating") 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    ['Dawit Haile', 'Dawit', 'Haile', 'technician@gmail.com', technicianHash, '+251911223344', 'Zone A', 'available', 'senior', 42, 4.8]
  );
  await client.query(
    `INSERT INTO technicians (name, "firstName", "lastName", email, "passwordHash", phone, zone, status, "skillLevel", "totalJobsCompleted", "averageRating") 
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    ['Biruk Lemma', 'Biruk', 'Lemma', 'biruk@water.com', technicianHash, '+251922334455', 'Zone B', 'on_job', 'mid', 18, 4.2]
  );
  console.log('✅ Technicians seeded');

  // Seed Devices
  const meterIds = ['ESP32-001', 'ESP32-018', 'ESP32-042', 'ESP32-007'];
  const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone A'];
  const deviceIds = [];
  for (let i = 0; i < meterIds.length; i++) {
    const r = await client.query(
      `INSERT INTO devices ("meterId", "customerId", zone, connectivity, "valveState", "batteryPercent", "lastSeenAt") 
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`,
      [meterIds[i], customerIds[i], zones[i], i === 3 ? 'OFFLINE' : 'ONLINE', 'OPEN', 100 - i * 10]
    );
    deviceIds.push(r.rows[0].id);
  }
  console.log('✅ Devices seeded');

  // Seed 7 days of readings
  const now = new Date();
  for (let day = 6; day >= 0; day--) {
    const ts = new Date(now);
    ts.setDate(ts.getDate() - day);
    for (let d = 0; d < deviceIds.length; d++) {
      const usage = 10000 + Math.random() * 5000 + day * 2000;
      await client.query(
        `INSERT INTO device_readings ("deviceId", "meterId", "flowRateLpm", "totalUsageLiters", "turbidityNtu", "valveState", connectivity, "batteryPercent", timestamp) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [deviceIds[d], meterIds[d], 8 + Math.random() * 4, usage, 1.5 + Math.random() * 2, 'OPEN', 'ONLINE', 90 - d * 5, ts.toISOString()]
      );
    }
  }
  console.log('✅ Device readings seeded (7 days)');

  // Seed Bills
  const billStart = new Date(); billStart.setDate(1);
  const billEnd = new Date(); billEnd.setMonth(billEnd.getMonth() + 1); billEnd.setDate(0);
  const dueDate = new Date(billEnd); dueDate.setDate(dueDate.getDate() + 15);
  for (let i = 0; i < customerIds.length; i++) {
    await client.query(
      `INSERT INTO bills ("customerId", "billingPeriodStart", "billingPeriodEnd", "usageLiters", "amountEtb", status, "dueDate") 
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [customerIds[i], billStart.toISOString(), billEnd.toISOString(), 12500 + i * 1500, 450 + i * 60, i === 0 ? 'paid' : 'unpaid', dueDate.toISOString()]
    );
  }
  console.log('✅ Bills seeded');

  // Seed Alerts
  const alertData = [
    ['LEAK_DETECTED', 'critical', 'High flow rate anomaly detected at ESP32-001', deviceIds[0], 'ESP32-001', customerIds[0]],
    ['LOW_BATTERY', 'medium', 'Battery below 30% on ESP32-007', deviceIds[3], 'ESP32-007', customerIds[3]],
    ['DEVICE_OFFLINE', 'high', 'Meter ESP32-007 has gone offline', deviceIds[3], 'ESP32-007', customerIds[3]],
    ['HIGH_TURBIDITY', 'medium', 'Turbidity above safety limit on ESP32-042', deviceIds[2], 'ESP32-042', customerIds[2]],
  ];
  for (const a of alertData) {
    await client.query(
      `INSERT INTO alerts (type, severity, message, "deviceId", "meterId", "customerId", status) VALUES ($1,$2,$3,$4,$5,$6,'open')`,
      a
    );
  }
  console.log('✅ Alerts seeded');

  // Seed Support Tickets
  await client.query(
    `INSERT INTO support_tickets ("customerId", subject, description, status, priority) VALUES ($1,$2,$3,$4,$5)`,
    [customerIds[0], 'Water meter not updating', 'My smart meter hasn\'t sent readings in 2 days.', 'open', 'high']
  );
  await client.query(
    `INSERT INTO support_tickets ("customerId", subject, description, status, priority) VALUES ($1,$2,$3,$4,$5)`,
    [customerIds[1], 'Billing discrepancy', 'My bill seems higher than expected this month.', 'in_progress', 'medium']
  );
  console.log('✅ Support tickets seeded');

  console.log('\n🎉 Supabase database seeded successfully!');
  console.log('   Admin login:    admin2@gmail.com / admin123');
  console.log('   Customer login: customer@gmail.com / customer123');
  await client.end();
}

run().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
