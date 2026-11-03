import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService implements OnModuleInit {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async onModuleInit() {
    const count = await this.auditRepo.count();
    if (count === 0) {
      const now = Date.now();
      const initialLogs: Partial<AuditLog>[] = [
        {
          actor: 'System Admin (admin2@gmail.com)',
          action: 'DEVICE_ACTIVATION',
          category: 'DEVICE',
          targetEntity: 'ESP32-001',
          details: 'Device online state verified and cellular telemetry link established.',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          createdAt: new Date(now - 1000 * 60 * 12),
        },
        {
          actor: 'Admin Yo 2',
          action: 'TICKET_ASSIGNED',
          category: 'TICKET',
          targetEntity: 'Ticket #27E34F37',
          details: 'Assigned valve failure ticket to technician Biruk Lemma.',
          status: 'SUCCESS',
          ipAddress: '192.168.1.104',
          createdAt: new Date(now - 1000 * 60 * 45),
        },
        {
          actor: 'System Admin (admin2@gmail.com)',
          action: 'VALVE_REMOTE_COMMAND',
          category: 'VALVE',
          targetEntity: 'ESP32-018',
          details: 'Remote command OPEN dispatched and confirmed by smart meter valve relay.',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          createdAt: new Date(now - 1000 * 60 * 90),
        },
        {
          actor: 'Admin Yo 2',
          action: 'CUSTOMER_ACTIVATED',
          category: 'CUSTOMER',
          targetEntity: 'Saikim Remiy',
          details: 'Customer profile verified and linked to meter ESP32-001.',
          status: 'SUCCESS',
          ipAddress: '192.168.1.104',
          createdAt: new Date(now - 1000 * 60 * 180),
        },
        {
          actor: 'System (Billing Cron)',
          action: 'INVOICE_GENERATED',
          category: 'BILLING',
          targetEntity: 'Invoice #INV-2026-003',
          details: 'Monthly billing cycle batch generated for Zone A & Zone B meters.',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          createdAt: new Date(now - 1000 * 60 * 360),
        },
        {
          actor: 'Chapa Gateway Webhook',
          action: 'PAYMENT_VERIFIED',
          category: 'BILLING',
          targetEntity: 'TX-CHP-99124',
          details: 'Payment of ETB 350.00 verified for customer Saikim Remiy via Telebirr.',
          status: 'SUCCESS',
          ipAddress: '197.156.77.22',
          createdAt: new Date(now - 1000 * 60 * 420),
        },
        {
          actor: 'Technician Biruk Lemma',
          action: 'TICKET_ACCEPTED',
          category: 'TICKET',
          targetEntity: 'Ticket #67F7DE29',
          details: 'Technician accepted dispatch for sensor calibration task in Zone B.',
          status: 'SUCCESS',
          ipAddress: '196.188.12.9',
          createdAt: new Date(now - 1000 * 60 * 540),
        },
        {
          actor: 'Admin Yo 2',
          action: 'TARIFF_UPDATED',
          category: 'BILLING',
          targetEntity: 'Tariff Tier 1 (Residential)',
          details: 'Updated base volumetric rate from 18.50 ETB/m3 to 20.00 ETB/m3.',
          status: 'SUCCESS',
          ipAddress: '192.168.1.104',
          createdAt: new Date(now - 1000 * 60 * 720),
        },
        {
          actor: 'System (Safety Watchdog)',
          action: 'ALARM_TRIGGERED',
          category: 'DEVICE',
          targetEntity: 'ESP32-042',
          details: 'High flow rate threshold (34.2 L/min) detected. Dispatched warning alert.',
          status: 'WARNING',
          ipAddress: '127.0.0.1',
          createdAt: new Date(now - 1000 * 60 * 850),
        },
        {
          actor: 'Admin Yo 2',
          action: 'DEVICE_REGISTERED',
          category: 'DEVICE',
          targetEntity: 'ESP32-005',
          details: 'New ultrasonic smart meter provisioned and assigned to Zone A.',
          status: 'SUCCESS',
          ipAddress: '192.168.1.104',
          createdAt: new Date(now - 1000 * 60 * 1440),
        },
      ];

      await this.auditRepo.save(initialLogs);
    }
  }

  async findAll(limit = 100): Promise<AuditLog[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    const entry = this.auditRepo.create(data);
    return this.auditRepo.save(entry);
  }
}
