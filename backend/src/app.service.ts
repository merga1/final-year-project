import { Injectable } from '@nestjs/common';
import { CustomersService } from './customers/customers.service';
import { DevicesService } from './devices/devices.service';
import { BillingService } from './billing/billing.service';
import { AlertsService } from './alerts/alerts.service';
import { SupportTicketsService } from './support-tickets/support-tickets.service';
import { PaymentsService } from './payments/payments.service';
import { ReadingsService } from './readings/readings.service';

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
      openTickets, criticalAlerts,
      pendingBills, overdueCount,
      verifiedToday, pendingPayments,
      totalCollected, totalPending,
      recentDevices, ticketQueue,
    ] = await Promise.all([
      this.customers.count(),
      this.customers.countByStatus('active'),
      this.devices.count(),
      this.devices.countByConnectivity('ONLINE'),
      this.tickets.countByStatus('open'),
      this.alerts.countCriticalToday(),
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
      summaryCards: [
        { label: 'Connected Devices', value: String(totalDevices) },
        { label: 'Open Tickets', value: String(openTickets) },
        { label: 'Pending Payments', value: String(pendingBills) },
        { label: 'Critical Alerts', value: String(criticalAlerts) },
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

    return {
      customerName: customer.name,
      connectionStatus: device?.connectivity ?? 'OFFLINE',
      meterId: device?.meterId ?? 'Not assigned',
      cards,
      alerts: [],
      updatedAt: new Date().toISOString(),
    };
  }
}
