import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomersService } from './customers/customers.service';
import { DevicesService } from './devices/devices.service';
import { BillingService } from './billing/billing.service';
import { AlertsService } from './alerts/alerts.service';
import { SupportTicketsService } from './support-tickets/support-tickets.service';
import { PaymentsService } from './payments/payments.service';
import { ReadingsService } from './readings/readings.service';
import { TechniciansService } from './technicians/technicians.service';

/** 420 -> 'ETB 420', 12500 -> 'ETB 12.5K' */
const formatEtb = (n: number) => (n >= 1000 ? `ETB ${(n / 1000).toFixed(1)}K` : `ETB ${Math.round(n)}`);

@Injectable()
export class AppService {
  constructor(
    private readonly customers: CustomersService,
    private readonly devices: DevicesService,
    private readonly billing: BillingService,
    private readonly alerts: AlertsService,
    private readonly tickets: SupportTicketsService,
    private readonly payments: PaymentsService,
    private readonly readings: ReadingsService,
    private readonly technicians: TechniciansService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'smart-water-backend',
      timestamp: new Date().toISOString(),
    };
  }

  async getAdminOverview() {
    const [
      totalCustomers, activeCustomers,
      totalDevices, onlineDevices,
      totalTickets, openTickets, criticalAlerts,
      totalTechnicians, topTechnicians,
      pendingBills, overdueCount,
      verifiedToday, pendingPayments,
      totalCollected, totalPending,
      recentDevices, ticketQueue,
    ] = await Promise.all([
      this.customers.count(),
      this.customers.countByStatus('active'),
      this.devices.count(),
      this.devices.countByConnectivity('ONLINE'),
      this.tickets.count(),
      this.tickets.countOpen(),
      this.alerts.countOpenCritical(),
      this.technicians.count(),
      this.technicians.findTop(5),
      this.billing.countByStatus('pending'),
      this.billing.countByStatus('overdue'),
      this.payments.countByStatus('verified'),
      this.payments.countByStatus('pending'),
      this.billing.totalCollected(),
      this.billing.totalPending(),
      this.devices.findRecent(5),
      this.tickets.findRecent(5),
    ]);

    return {
      systemStatus: onlineDevices === totalDevices ? 'System Stable' : 'Attention Required',
      stats: {
        totalCustomers,
        totalTechnicians,
        criticalAlerts,
        totalTickets,
      },
      topTechnicians: topTechnicians.map(t => ({
        id: t.id,
        name: t.name,
        repairs: t.completedRepairs || 0,
      })),
      summaryCards: [
        { label: 'Total Customers', value: String(totalCustomers) },
        { label: 'Total Technicians', value: String(totalTechnicians) },
        { label: 'Critical Alerts', value: String(criticalAlerts) },
        { label: 'Total Tickets', value: String(totalTickets) },
      ],
      detailCards: [
        { label: 'Total Customers', value: String(totalCustomers) },
        { label: 'Active Accounts', value: String(activeCustomers) },
        { label: 'Devices Online', value: String(onlineDevices) },
        { label: 'Overdue Bills', value: String(overdueCount) },
        { label: 'Verified Today', value: String(verifiedToday) },
        { label: 'Pending Payments', value: String(pendingPayments) },
        { label: 'Collected (ETB)', value: formatEtb(totalCollected) },
        { label: 'Pending (ETB)', value: formatEtb(totalPending) },
      ],
      recentDevices: recentDevices.map(d => ({
        id: d.meterId,
        customer: d.customerId,
        status: d.connectivity === 'ONLINE' ? 'Online' : d.connectivity === 'WARNING' ? 'Warning' : 'Offline',
        note: d.valveState === 'OPEN' ? 'Valve open' : 'Valve closed',
      })),
      ticketQueue: ticketQueue.map(t => ({
        id: t.id.slice(0, 8).toUpperCase(),
        issue: t.issue,
        priority: t.priority,
        status: t.status,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async getMobileHome(userId: string, meterId?: string) {
    const customer = await this.customers.findOne(userId);
    // Prefer the live customer record so a meter assigned after login is visible
    // without forcing the user to sign in again.
    const effectiveMeterId = customer.meterId || meterId || undefined;
    const device = effectiveMeterId ? await this.devices.findByMeterId(effectiveMeterId) : null;
    const latestReading = effectiveMeterId
      ? await this.readings.findLatestByMeterId(effectiveMeterId)
      : null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const [dailyUsage, monthlyUsage] = effectiveMeterId
      ? await Promise.all([
          this.readings.usageSince(effectiveMeterId, startOfToday),
          this.readings.usageSince(effectiveMeterId, startOfMonth),
        ])
      : [0, 0];
    const myBills = await this.billing.findByCustomer(userId);
    const unpaidBills = myBills.filter(b => b.status === 'pending' || b.status === 'overdue');
    const pendingBill = unpaidBills[0];
    const outstandingTotal = unpaidBills.reduce((sum, bill) => sum + bill.amountEtb, 0);
    const waterQuality =
      latestReading
        ? latestReading.turbidityNtu <= 5
          ? 'Safe'
          : latestReading.turbidityNtu <= 15
            ? 'Warning'
            : 'Contaminated'
        : 'Unknown';
    const waterQualityAdvice = latestReading
      ? latestReading.turbidityNtu <= 5
        ? 'Water is within the safe turbidity range (0-5 NTU).'
        : latestReading.turbidityNtu <= 15
          ? 'Turbidity is borderline. Let the tap run for a moment and avoid drinking until it clears.'
          : 'High turbidity detected. Do not drink the water and raise a support ticket.'
      : 'No sensor reading is available yet.';

    const cards = [
      {
        title: 'Water Quality',
        value: latestReading ? (latestReading.turbidityNtu <= 5 ? 'Safe' : 'Warning') : 'N/A',
        subtitle: latestReading ? `Turbidity: ${latestReading.turbidityNtu} NTU` : 'No reading yet',
        tone: latestReading && latestReading.turbidityNtu <= 5 ? 'success' : 'warning',
      },
      {
        title: 'Current Usage',
        value: latestReading ? `${latestReading.flowRateLpm} L/min` : 'N/A',
        subtitle: latestReading ? `Total: ${latestReading.totalUsageLiters.toFixed(0)} L` : 'No reading yet',
        tone: 'info',
      },
      {
        title: 'Valve State',
        value: device?.valveState ?? 'N/A',
        subtitle: 'Remote control enabled',
        tone: 'warning',
      },
      {
        title: 'Outstanding Bill',
        value: pendingBill ? `ETB ${pendingBill.amountEtb}` : 'No pending bill',
        subtitle: pendingBill ? `Due: ${pendingBill.dueDate}` : 'All paid up!',
        tone: pendingBill ? 'danger' : 'success',
      },
    ];

    const latestTimestamp = latestReading?.timestamp ?? device?.lastSeenAt ?? null;
    const staleAfterMs = 60_000;
    const isOffline = !latestTimestamp || Date.now() - new Date(latestTimestamp).getTime() > staleAfterMs || device?.connectivity === 'OFFLINE';
    return {
      userId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAddress: customer.address ?? '',
      zone: customer.zone ?? device?.zone ?? 'Zone A',
      accountStatus: customer.accountStatus ?? 'active',
      connectionStatus: isOffline ? 'OFFLINE' : device?.connectivity ?? 'ONLINE',
      meterId: device?.meterId ?? effectiveMeterId ?? 'Not assigned',
      flowRateLpm: latestReading?.flowRateLpm ?? 0.0,
      turbidityNtu: latestReading?.turbidityNtu ?? 0.0,
      monthlyConsumptionLiters: monthlyUsage,
      dailyConsumptionLiters: dailyUsage,
      waterQualityStatus: waterQuality,
      waterQualityAdvice,
      batteryPercent: device?.batteryPercent ?? null,
      installedAt: device?.createdAt ?? null,
      outstandingBillEtb: Math.round(outstandingTotal * 100) / 100,
      outstandingBillCount: unpaidBills.length,
      outstandingBillDueDate: pendingBill?.dueDate ?? null,
      lastUpdatedAt: latestTimestamp,
      deviceOffline: isOffline,
      valveState: device?.valveState ?? 'N/A',
      cards,
      alerts: effectiveMeterId ? await this.alerts.findByMeterId(effectiveMeterId) : [],
      updatedAt: new Date().toISOString(),
    };
  }

  async getTechnicianHome(technicianId: string) {
    const [tickets, technician] = await Promise.all([
      this.tickets.findByTechnician(technicianId),
      this.technicians.findOne(technicianId).catch(() => null),
    ]);
    const countWhere = (statuses: string[]) =>
      tickets.filter((t) => statuses.includes(t.status.toLowerCase())).length;

    // Status buckets are mutually exclusive so one ticket cannot appear twice.
    return {
      assigned: countWhere(['assigned', 'open', 'pending']),
      accepted: countWhere(['accepted']),
      inProgress: countWhere(['in_progress']),
      awaitingCustomer: countWhere(['awaiting_customer']),
      resolved: countWhere(['resolved', 'closed']),
      total: tickets.length,
      technicianName: technician?.name ?? 'Technician',
      email: technician?.email ?? '',
      phone: technician?.phone ?? '',
      zone: technician?.zone ?? 'Zone A',
      specialization: technician?.specialization ?? 'No specialization',
      dutyStatus: technician?.status ?? 'on_duty',
      currentJobCount: technician?.currentJobCount ?? 0,
      completedRepairs: technician?.completedRepairs ?? 0,
      updatedAt: new Date().toISOString(),
    };
  }

  private async resolveTicketDevice(ticket: { deviceId?: string | null; customerId?: string | null }) {
    if (ticket.deviceId) {
      try {
        return await this.devices.resolve(ticket.deviceId);
      } catch {
        // Fall through to customer-linked device.
      }
    }
    if (ticket.customerId) {
      return this.devices.findByCustomerId(ticket.customerId);
    }
    return null;
  }

  async getTechnicianDevice(ticketId: string, technicianId: string) {
    const ticket = await this.tickets.findOneForTechnician(ticketId, technicianId);
    const device = await this.resolveTicketDevice(ticket);
    const meterId = device?.meterId;
    const [reading, alerts] = meterId
      ? await Promise.all([this.readings.findLatestByMeterId(meterId), this.alerts.findByMeterId(meterId)])
      : [null, []];
    return {
      ticketId: ticket.id,
      ticketType: ticket.type,
      priority: ticket.priority,
      customerName: ticket.customerName,
      customerAddress: ticket.customerAddress ?? '',
      deviceId: device?.id ?? null,
      meterId: meterId ?? null,
      zone: device?.zone ?? 'Unknown zone',
      batteryPercent: device?.batteryPercent ?? null,
      flowRateLpm: reading?.flowRateLpm ?? 0,
      turbidityNtu: reading?.turbidityNtu ?? 0,
      valveState: reading?.valveState ?? device?.valveState ?? 'UNKNOWN',
      connectivity: device?.connectivity ?? 'UNKNOWN',
      lastUpdatedAt: reading?.timestamp ?? device?.lastSeenAt ?? null,
      latitude: device?.latitude ?? null,
      longitude: device?.longitude ?? null,
      alerts,
    };
  }

  async setMeterLocation(ticketId: string, technicianId: string, latitude: number, longitude: number) {
    const lat = typeof latitude === 'number' ? latitude : Number(latitude);
    const lng = typeof longitude === 'number' ? longitude : Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('latitude and longitude must be numbers');
    }
    if (lat < -90 || lat > 90) throw new BadRequestException('latitude must be between -90 and 90');
    if (lng < -180 || lng > 180) throw new BadRequestException('longitude must be between -180 and 180');

    const ticket = await this.tickets.findOneForTechnician(ticketId, technicianId);
    const device = await this.resolveTicketDevice(ticket);

    if (!device) {
      throw new BadRequestException(
        'No device linked to this ticket. Ask an admin to assign a water meter first.',
      );
    }

    await this.devices.updateByMeterId(device.meterId, { latitude: lat, longitude: lng });
    return {
      success: true,
      meterId: device.meterId,
      latitude: lat,
      longitude: lng,
      message: 'Meter location updated successfully',
    };
  }

  /** Technician activates the ticket's meter for usage after installation. */
  async activateTicketMeter(ticketId: string, technicianId: string) {
    const ticket = await this.tickets.findOneForTechnician(ticketId, technicianId);
    const device = await this.resolveTicketDevice(ticket);

    if (!device) {
      throw new BadRequestException(
        'No device linked to this ticket. Ask an admin to assign a meter first.',
      );
    }

    await this.devices.updateByMeterId(device.meterId, {
      connectivity: 'ONLINE',
      customerId: ticket.customerId || device.customerId,
    });

    if (ticket.customerId) {
      try {
        await this.customers.update(ticket.customerId, {
          meterId: device.meterId,
          accountStatus: 'active',
        });
      } catch (err) {
        // Device is already ONLINE; customer link failure should not hide activation success.
        console.warn('activateTicketMeter: customer link failed', err);
      }
    }

    return {
      success: true,
      meterId: device.meterId,
      connectivity: 'ONLINE',
      message: `Water meter ${device.meterId} activated for usage`,
    };
  }
}
