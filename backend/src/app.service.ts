import { Injectable } from '@nestjs/common';
import { CustomersService } from './customers/customers.service';
import { DevicesService } from './devices/devices.service';
import { BillingService } from './billing/billing.service';
import { AlertsService } from './alerts/alerts.service';
import { SupportTicketsService } from './support-tickets/support-tickets.service';
import { PaymentsService } from './payments/payments.service';
import { ReadingsService } from './readings/readings.service';
import { TechniciansService } from './technicians/technicians.service';

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
      this.tickets.countByStatus('open'),
      this.alerts.countCriticalToday(),
      this.technicians.count(),
      this.technicians.findTop(5),
      this.billing.countByStatus('pending'),
      this.billing.countByStatus('overdue'),
      this.payments.countByStatus('verified'),
      this.payments.countByStatus('pending'),
      this.billing.totalCollected(),
      this.billing.totalPending(),
      this.devices.findAll().then(d => d.slice(0, 5)),
      this.tickets.findAll().then(t => t.slice(0, 5)),
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
        { label: 'Collected (ETB)', value: `ETB ${(totalCollected / 1000).toFixed(0)}K` },
        { label: 'Pending (ETB)', value: `ETB ${(totalPending / 1000).toFixed(0)}K` },
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
    const device = meterId ? await this.devices.findByMeterId(meterId) : null;
    const latestReading = meterId ? await this.readings.findLatestByMeterId(meterId) : null;
    const myBills = await this.billing.findByCustomer(userId);
    const pendingBill = myBills.find(b => b.status === 'pending');

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
      connectionStatus: isOffline ? 'OFFLINE' : device?.connectivity ?? 'ONLINE',
      meterId: device?.meterId ?? 'ESP32-001',
      flowRateLpm: latestReading?.flowRateLpm ?? 0.0,
      turbidityNtu: latestReading?.turbidityNtu ?? 0.0,
      monthlyConsumptionLiters: latestReading?.totalUsageLiters ?? 0,
      dailyConsumptionLiters: latestReading?.totalUsageLiters ?? 0,
      waterQualityStatus: latestReading ? (latestReading.turbidityNtu <= 5 ? 'Safe' : latestReading.turbidityNtu <= 15 ? 'Warning' : 'Contaminated') : 'Unknown',
      lastUpdatedAt: latestTimestamp,
      deviceOffline: isOffline,
      valveState: device?.valveState ?? 'OPEN',
      cards,
      alerts: await this.alerts.findByMeterId(meterId ?? ''),
      updatedAt: new Date().toISOString(),
    };
  }

  async getTechnicianHome(technicianId: string) {
    const tickets = await this.tickets.findByTechnician(technicianId);
    return {
      assigned: tickets.filter((t) => ['assigned', 'open', 'pending'].includes(t.status.toLowerCase())).length,
      accepted: tickets.filter((t) => ['accepted', 'in_progress'].includes(t.status.toLowerCase())).length,
      resolved: tickets.filter((t) => ['resolved', 'closed'].includes(t.status.toLowerCase())).length,
      total: tickets.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getTechnicianDevice(ticketId: string, technicianId: string) {
    const ticket = await this.tickets.findOneForTechnician(ticketId, technicianId);
    const device = ticket.deviceId
      ? await this.devices.findOne(ticket.deviceId)
      : ticket.customerId
        ? await this.devices.findAll().then((items) => items.find((item) => item.customerId === ticket.customerId))
        : null;
    const meterId = device?.meterId;
    const [reading, alerts] = meterId
      ? await Promise.all([this.readings.findLatestByMeterId(meterId), this.alerts.findByMeterId(meterId)])
      : [null, []];
    return {
      ticketId: ticket.id,
      deviceId: device?.id ?? null,
      meterId: meterId ?? null,
      flowRateLpm: reading?.flowRateLpm ?? 0,
      turbidityNtu: reading?.turbidityNtu ?? 0,
      valveState: reading?.valveState ?? device?.valveState ?? 'UNKNOWN',
      connectivity: device?.connectivity ?? 'UNKNOWN',
      lastUpdatedAt: reading?.timestamp ?? device?.lastSeenAt ?? null,
      alerts,
    };
  }
}
