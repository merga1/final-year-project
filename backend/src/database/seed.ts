/**
 * Database seed script — run once to populate demo data.
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

  // Save customers one by one to get typed Customer instances back
  const c0 = await customerRepo.save(customerRepo.create({ name: 'System Admin', email: 'admin@admin.water', passwordHash: adminHash, zone: 'HQ', accountStatus: 'active' }));
  const c1 = await customerRepo.save(customerRepo.create({ name: 'Ops Manager', email: 'ops@admin.water', passwordHash: adminHash, zone: 'HQ', accountStatus: 'active' }));
  const c2 = await customerRepo.save(customerRepo.create({ name: 'Abel Tesfaye', email: 'abel@customer.com', passwordHash: customerHash, meterId: 'ESP32-001', zone: 'Zone A', accountStatus: 'active' }));
  const c3 = await customerRepo.save(customerRepo.create({ name: 'Liya Bekele', email: 'liya@customer.com', passwordHash: customerHash, meterId: 'ESP32-018', zone: 'Zone B', accountStatus: 'active' }));
  const c4 = await customerRepo.save(customerRepo.create({ name: 'Meron Alemu', email: 'meron@customer.com', passwordHash: customerHash, meterId: 'ESP32-042', zone: 'Zone C', accountStatus: 'suspended' }));
  const c5 = await customerRepo.save(customerRepo.create({ name: 'Dawit Haile', email: 'dawit@customer.com', passwordHash: customerHash, meterId: 'ESP32-005', zone: 'Zone A', accountStatus: 'active' }));
  const c6 = await customerRepo.save(customerRepo.create({ name: 'Sara Tadesse', email: 'sara@customer.com', passwordHash: customerHash, meterId: 'ESP32-011', zone: 'Zone B', accountStatus: 'active' }));
  console.log('✅ Seeded 7 customers');

  const deviceRepo = ds.getRepository(Device);
  const d0 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-001', customerId: c2.id, zone: 'Zone A', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 88, lastSeenAt: new Date() }));
  const d1 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-018', customerId: c3.id, zone: 'Zone B', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 72, lastSeenAt: new Date() }));
  const d2 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-042', customerId: c4.id, zone: 'Zone C', connectivity: 'OFFLINE', valveState: 'CLOSED', batteryPercent: 12, lastSeenAt: new Date(Date.now() - 25 * 60000) }));
  const d3 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-005', customerId: c5.id, zone: 'Zone A', connectivity: 'ONLINE', valveState: 'OPEN', batteryPercent: 95, lastSeenAt: new Date() }));
  const d4 = await deviceRepo.save(deviceRepo.create({ meterId: 'ESP32-011', customerId: c6.id, zone: 'Zone B', connectivity: 'WARNING', valveState: 'OPEN', batteryPercent: 45, lastSeenAt: new Date() }));
  const devices = [d0, d1, d2, d3, d4];
  console.log('✅ Seeded 5 devices');

  const readingRepo = ds.getRepository(DeviceReading);
  for (let day = 6; day >= 0; day--) {
    for (const device of devices) {
      const ts = new Date();
      ts.setDate(ts.getDate() - day);
      ts.setHours(8, 0, 0, 0);
      const reading = readingRepo.create({
        deviceId: device.id,
        meterId: device.meterId,
        flowRateLpm: parseFloat((10 + Math.random() * 10).toFixed(1)),
        totalUsageLiters: parseFloat((8000 + Math.random() * 2000 + day * 150).toFixed(1)),
        turbidityNtu: parseFloat((1.5 + Math.random() * 2).toFixed(1)),
        valveState: device.valveState,
        connectivity: device.connectivity,
        batteryPercent: device.batteryPercent,
      });
      // TypeORM doesn't allow setting @CreateDateColumn directly, use raw query for seed
      await readingRepo.save(reading);
    }
  }
  console.log('✅ Seeded device readings');

  const billRepo = ds.getRepository(Bill);
  await billRepo.save([
    billRepo.create({ customerId: c2.id, customerName: 'Abel Tesfaye', usageLiters: 4800, amountEtb: 420, status: 'pending', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-19' }),
    billRepo.create({ customerId: c3.id, customerName: 'Liya Bekele', usageLiters: 6200, amountEtb: 544, status: 'overdue', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-11' }),
    billRepo.create({ customerId: c5.id, customerName: 'Dawit Haile', usageLiters: 3100, amountEtb: 272, status: 'paid', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-15' }),
    billRepo.create({ customerId: c6.id, customerName: 'Sara Tadesse', usageLiters: 5400, amountEtb: 473, status: 'pending', periodStart: '2026-08-01', periodEnd: '2026-08-31', dueDate: '2026-09-20' }),
    billRepo.create({ customerId: c2.id, customerName: 'Abel Tesfaye', usageLiters: 4200, amountEtb: 368, status: 'paid', periodStart: '2026-07-01', periodEnd: '2026-07-31', dueDate: '2026-08-15' }),
  ]);
  console.log('✅ Seeded 5 bills');

  const paymentRepo = ds.getRepository(Payment);
  await paymentRepo.save([
    paymentRepo.create({ customerId: c5.id, customerName: 'Dawit Haile', amount: 272, method: 'chappa', reference: 'CHF-00291', status: 'verified' }),
    paymentRepo.create({ customerId: c2.id, customerName: 'Abel Tesfaye', amount: 368, method: 'bank_transfer', reference: 'BNK-00814', status: 'verified' }),
    paymentRepo.create({ customerId: c3.id, customerName: 'Liya Bekele', amount: 544, method: 'mobile_payment', reference: 'MPY-00182', status: 'pending' }),
  ]);
  console.log('✅ Seeded 3 payments');

  const alertRepo = ds.getRepository(Alert);
  await alertRepo.save([
    alertRepo.create({ deviceId: d1.id, meterId: 'ESP32-018', type: 'HIGH_USAGE', message: 'Flow rate 32.1 L/min is above normal', severity: 'warning', acknowledged: false }),
    alertRepo.create({ deviceId: d2.id, meterId: 'ESP32-042', type: 'DEVICE_OFFLINE', message: 'No reading for more than 20 minutes', severity: 'critical', acknowledged: false }),
    alertRepo.create({ deviceId: d2.id, meterId: 'ESP32-042', type: 'LOW_BATTERY', message: 'Battery at 12%', severity: 'warning', acknowledged: false }),
    alertRepo.create({ deviceId: d0.id, meterId: 'ESP32-001', type: 'WATER_QUALITY', message: 'Turbidity 5.8 NTU — resolved after flush', severity: 'critical', acknowledged: true, acknowledgedBy: 'System Admin' }),
  ]);
  console.log('✅ Seeded 4 alerts');

  const ticketRepo = ds.getRepository(SupportTicket);
  await ticketRepo.save([
    ticketRepo.create({ customerId: c2.id, customerName: 'Abel Tesfaye', technicianName: 'Hana Wolde', issue: 'Poor water quality after rain', priority: 'High', status: 'assigned' }),
    ticketRepo.create({ customerId: c3.id, customerName: 'Liya Bekele', issue: 'Valve not responding to remote command', priority: 'High', status: 'open' }),
    ticketRepo.create({ customerId: c6.id, customerName: 'Sara Tadesse', issue: 'Billing dispute — meter reading incorrect', priority: 'Medium', status: 'resolved' }),
  ]);
  console.log('✅ Seeded 3 support tickets');

  const techRepo = ds.getRepository(Technician);
  await techRepo.save([
    techRepo.create({ name: 'Hana Wolde', email: 'hana@tech.water', zone: 'Zone A', status: 'on_duty', currentJobCount: 2, phone: '+251911001001' }),
    techRepo.create({ name: 'Samuel Desta', email: 'samuel@tech.water', zone: 'Zone B', status: 'on_duty', currentJobCount: 0, phone: '+251911002002' }),
    techRepo.create({ name: 'Ruth Mamo', email: 'ruth@tech.water', zone: 'Zone C', status: 'on_duty', currentJobCount: 1, phone: '+251911003003' }),
  ]);
  console.log('✅ Seeded 3 technicians');

  await ds.destroy();
  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('  Admin:    admin@admin.water / admin123');
  console.log('  Customer: abel@customer.com / customer123');
}

seed().catch(err => { console.error(err); process.exit(1); });
