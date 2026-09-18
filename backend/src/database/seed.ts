/**
 * Database seed script — populates demo data matching dashboard design.
 * Usage: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

import { Customer } from '../customers/customer.entity';
import { Device } from '../devices/device.entity';
import { DeviceReading } from '../readings/device-reading.entity';
import { Bill } from '../billing/bill.entity';
import { Payment } from '../payments/payment.entity';
import { Alert } from '../alerts/alert.entity';
import { SupportTicket } from '../support-tickets/support-ticket.entity';
import { Technician } from '../technicians/technician.entity';

const ds = new DataSource({
  type: 'better-sqlite3',
  database: path.resolve(__dirname, '../../water.sqlite'),
  entities: [Customer, Device, DeviceReading, Bill, Payment, Alert, SupportTicket, Technician],
  synchronize: true,
});

async function seed() {
  await ds.initialize();
  console.log('🌱 Seeding database...');

  const customerRepo = ds.getRepository(Customer);
  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);

  // Clear existing demo tables to ensure consistent seed matching screenshots
  await ds.query('DELETE FROM support_tickets');
  await ds.query('DELETE FROM payments');
  await ds.query('DELETE FROM bills');
  await ds.query('DELETE FROM alerts');
  await ds.query('DELETE FROM device_readings');
  await ds.query('DELETE FROM devices');
  await ds.query('DELETE FROM technicians');
  await ds.query('DELETE FROM customers');

  // Seed Admin Accounts
  const admin1 = await customerRepo.save(customerRepo.create({
    name: 'Yo 2',
    firstName: 'Yo',
    lastName: '2',
    email: 'admin2@gmail.com',
    passwordHash: adminHash,
    role: 'admin',
    zone: 'HQ',
    accountStatus: 'active',
  }));

  const admin2 = await customerRepo.save(customerRepo.create({
    name: 'System Admin',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@admin.water',
    passwordHash: adminHash,
    role: 'admin',
    zone: 'HQ',
    accountStatus: 'active',
  }));

  // Seed Customers from screenshot (Page 4)
  const c1 = await customerRepo.save(customerRepo.create({
    name: 'Saikim Remiy',
    firstName: 'Saikim',
    lastName: 'Remiy',
    email: 'mikiasylmer7362@gmail.com',
    passwordHash: customerHash,
    meterId: 'ESP32-001',
    zone: 'Zone A',
    accountStatus: 'active',
    address: 'Bole Subcity, House 412',
    dateOfBirth: '1996-04-12',
  }));

  const c2 = await customerRepo.save(customerRepo.create({
    name: 'mike garedew',
    firstName: 'mike',
    lastName: 'garedew',
    email: 'mikegar@gmail.com',
    passwordHash: customerHash,
    meterId: 'ESP32-018',
    zone: 'Zone B',
    accountStatus: 'active',
    address: 'Yeka Subcity, House 109',
    dateOfBirth: '1994-09-21',
  }));

  const c3 = await customerRepo.save(customerRepo.create({
    name: 'MIKIAS ABEGAZ',
    firstName: 'MIKIAS',
    lastName: 'ABEGAZ',
    email: 'customer@gmail.com',
    passwordHash: customerHash,
    meterId: 'ESP32-042',
    zone: 'Zone C',
    accountStatus: 'active',
    address: 'Kirkos Subcity, House 220',
    dateOfBirth: '1998-11-05',
  }));

  const c4 = await customerRepo.save(customerRepo.create({
    name: 'MIKIAS ABEGAZ',
    firstName: 'MIKIAS',
    lastName: 'ABEGAZ',
    email: 'mikiytylqmer17@gmail.com',
    passwordHash: customerHash,
    meterId: 'ESP32-005',
    zone: 'Zone A',
    accountStatus: 'active',
    address: 'Arada Subcity, House 55',
    dateOfBirth: '1995-02-18',
  }));

  // Seed additional customers to make count realistic (17 total customers)
  const additionalCustomers = [
    { name: 'Abel Tesfaye', email: 'abel@customer.com', meterId: 'ESP32-010' },
    { name: 'Liya Bekele', email: 'liya@customer.com', meterId: 'ESP32-011' },
    { name: 'Meron Alemu', email: 'meron@customer.com', meterId: 'ESP32-012' },
    { name: 'Dawit Haile', email: 'dawit@customer.com', meterId: 'ESP32-013' },
    { name: 'Sara Tadesse', email: 'sara@customer.com', meterId: 'ESP32-014' },
    { name: 'Bethlehem Tulu', email: 'beth@customer.com', meterId: 'ESP32-015' },
    { name: 'Yonas Girma', email: 'yonas@customer.com', meterId: 'ESP32-016' },
    { name: 'Selamawit Kebede', email: 'selam@customer.com', meterId: 'ESP32-017' },
    { name: 'Natnael Worku', email: 'nati@customer.com', meterId: 'ESP32-019' },
    { name: 'Eskinder Nega', email: 'eski@customer.com', meterId: 'ESP32-020' },
    { name: 'Kalkidan Assefa', email: 'kal@customer.com', meterId: 'ESP32-021' },
  ];

  for (const c of additionalCustomers) {
    await customerRepo.save(customerRepo.create({
      name: c.name,
      email: c.email,
      passwordHash: customerHash,
      meterId: c.meterId,
      zone: 'Zone A',
      accountStatus: 'active',
    }));
  }
  console.log('✅ Seeded customers (17 accounts)');

  // Seed Technicians matching screenshots (Top Technicians + Technicians list)
  const techRepo = ds.getRepository(Technician);
  const t0 = await techRepo.save(techRepo.create({
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@tech.water',
    phone: '+251911112233',
    specialization: 'Leak Detection & Pump Systems',
    status: 'on_duty',
    completedRepairs: 12,
    currentJobCount: 1,
    zone: 'Zone A',
  }));

  const t1 = await techRepo.save(techRepo.create({
    name: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@tech.water',
    phone: '+251911223344',
    specialization: 'Water Quality & Filtration',
    status: 'on_duty',
    completedRepairs: 9,
    currentJobCount: 2,
    zone: 'Zone B',
  }));

  const t2 = await techRepo.save(techRepo.create({
    name: 'Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'm.chen@tech.water',
    phone: '+251911334455',
    specialization: 'Smart Meter Calibration',
    status: 'on_duty',
    completedRepairs: 7,
    currentJobCount: 0,
    zone: 'Zone C',
  }));

  // Technicians from Page 2 screenshot list
  const t3 = await techRepo.save(techRepo.create({
    name: 'MIKIAS ABEGAZ',
    firstName: 'MIKIAS',
    lastName: 'ABEGAZ',
    email: 'm@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 4,
    currentJobCount: 0,
  }));

  const t4 = await techRepo.save(techRepo.create({
    name: 'as df',
    firstName: 'as',
    lastName: 'df',
    email: 'asd@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 3,
    currentJobCount: 0,
  }));

  const t5 = await techRepo.save(techRepo.create({
    name: 'abu mesh',
    firstName: 'abu',
    lastName: 'mesh',
    email: 'abumesh@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 2,
    currentJobCount: 1,
  }));

  const t6 = await techRepo.save(techRepo.create({
    name: 'MIKIAS ABEGAZ',
    firstName: 'MIKIAS',
    lastName: 'ABEGAZ',
    email: 'asdfgh2@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 1,
    currentJobCount: 0,
  }));

  const t7 = await techRepo.save(techRepo.create({
    name: 'MIKIAS ABEGAZ',
    firstName: 'MIKIAS',
    lastName: 'ABEGAZ',
    email: 'a@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 2,
    currentJobCount: 0,
  }));

  const t8 = await techRepo.save(techRepo.create({
    name: 'ma ya',
    firstName: 'ma',
    lastName: 'ya',
    email: 'tech1234@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 5,
    currentJobCount: 1,
  }));

  const t9 = await techRepo.save(techRepo.create({
    name: 'abe kebe',
    firstName: 'abe',
    lastName: 'kebe',
    email: 'abekebe@gmail.com',
    specialization: 'No specialization',
    status: 'on_duty',
    completedRepairs: 3,
    currentJobCount: 0,
  }));

  // Additional technicians to total 13 (as shown in dashboard card)
  const additionalTechs = [
    { name: 'Hana Wolde', email: 'hana@tech.water', completedRepairs: 4 },
    { name: 'Samuel Desta', email: 'samuel@tech.water', completedRepairs: 1 },
    { name: 'Ruth Mamo', email: 'ruth@tech.water', completedRepairs: 2 },
  ];
  for (const t of additionalTechs) {
    await techRepo.save(techRepo.create({
      name: t.name,
      email: t.email,
      specialization: 'No specialization',
      status: 'on_duty',
      completedRepairs: t.completedRepairs,
      currentJobCount: 0,
    }));
  }
  console.log('✅ Seeded 13 technicians');

  // Seed Devices
  const deviceRepo = ds.getRepository(Device);
  const d0 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-001', customerId: c1.id, zone: 'Zone A', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 92, lastSeenAt: new Date() }));
  const d1 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-018', customerId: c2.id, zone: 'Zone B', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 84, lastSeenAt: new Date() }));
  const d2 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-042', customerId: c3.id, zone: 'Zone C', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 78, lastSeenAt: new Date() }));
  const d3 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-005', customerId: c4.id, zone: 'Zone A', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 95, lastSeenAt: new Date() }));
  console.log('✅ Seeded devices');

  // Seed Support Tickets matching screenshot (Page 3)
  const ticketRepo = ds.getRepository(SupportTicket);
  await ticketRepo.save([
    ticketRepo.create({
      id: '67f7de29-dc4d-1ecc-7052-d27800000001',
      customerId: c1.id,
      customerName: c1.name,
      technicianId: t0.id,
      technicianName: t0.name,
      type: 'SENSOR',
      issue: 'Sensor reading discrepancy',
      description: 'what',
      priority: 'Medium',
      status: 'Pending',
    }),
    ticketRepo.create({
      id: '67f7de29-dc4d-1ecc-7052-d2a100000002',
      customerId: c2.id,
      customerName: c2.name,
      technicianId: t1.id,
      technicianName: t1.name,
      type: 'SENSOR',
      issue: 'Turbidity spike alert',
      description: 'what',
      priority: 'High',
      status: 'resolved',
    }),
    ticketRepo.create({
      id: '67f7e058-dc4d-1ecc-7052-d2bc00000003',
      customerId: c3.id,
      customerName: c3.name,
      technicianId: t2.id,
      technicianName: t2.name,
      type: 'SENSOR',
      issue: 'Flow rate fluctuation',
      description: 'asd',
      priority: 'Low',
      status: 'Pending',
    }),
    ticketRepo.create({
      id: '67f7e099-dc4d-1ecc-7052-d2bc00000004',
      customerId: c4.id,
      customerName: c4.name,
      technicianId: t0.id,
      technicianName: t0.name,
      type: 'LEAK',
      issue: 'Pipe leak detected near meter box',
      description: 'Water pressure drop observed',
      priority: 'High',
      status: 'open',
    }),
    ticketRepo.create({
      id: '67f7e112-dc4d-1ecc-7052-d2bc00000005',
      customerId: c1.id,
      customerName: c1.name,
      technicianId: t1.id,
      technicianName: t1.name,
      type: 'VALVE',
      issue: 'Valve remote toggle response delay',
      description: 'Remote command takes 2 mins',
      priority: 'Medium',
      status: 'assigned',
    }),
  ]);
  // Additional tickets to reach total
  for (let i = 6; i <= 12; i++) {
    await ticketRepo.save(ticketRepo.create({
      customerId: c2.id,
      customerName: 'Customer',
      type: 'SENSOR',
      issue: `Regular sensor diagnostic #${i}`,
      description: 'Automated diagnostic check',
      priority: 'Low',
      status: 'resolved',
    }));
  }
  console.log('✅ Seeded 12 support tickets (matching screenshot count)');

  // Seed Bills & Payments
  const billRepo = ds.getRepository(Bill);
  await billRepo.save([
    billRepo.create({ customerId: c1.id, customerName: c1.name, usageLiters: 4800, amountEtb: 420, status: 'pending', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-19' }),
    billRepo.create({ customerId: c2.id, customerName: c2.name, usageLiters: 6200, amountEtb: 544, status: 'paid', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-11' }),
  ]);

  const paymentRepo = ds.getRepository(Payment);
  await paymentRepo.save([
    paymentRepo.create({ customerId: c2.id, customerName: c2.name, amount: 544, method: 'chapa', reference: 'CHP-00291', status: 'verified' }),
  ]);

  await ds.destroy();
  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('  Admin (from screenshots): admin2@gmail.com / admin123');
  console.log('  Admin (system):           admin@admin.water / admin123');
  console.log('  Customer:                 mikiasylmer7362@gmail.com / customer123');
}

seed().catch(err => { console.error(err); process.exit(1); });
