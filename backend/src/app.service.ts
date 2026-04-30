import { Injectable } from '@nestjs/common';

type SummaryCard = {
  label: string;
  value: string;
};

type RecentDevice = {
  id: string;
  customer: string;
  status: 'Online' | 'Warning' | 'Offline';
  note: string;
};

type Ticket = {
  id: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
};

type MobileStatusCard = {
  title: string;
  value: string;
  subtitle: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
};

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'smart-water-backend',
      timestamp: new Date().toISOString(),
    };
  }

  getAdminOverview() {
    const summaryCards: SummaryCard[] = [
      { label: 'Connected Devices', value: '128' },
      { label: 'Open Tickets', value: '14' },
      { label: 'Pending Payments', value: '37' },
      { label: 'Critical Alerts', value: '3' },
    ];

    const recentDevices: RecentDevice[] = [
      { id: 'ESP32-001', customer: 'Abel Tesfaye', status: 'Online', note: 'Water quality safe' },
      { id: 'ESP32-018', customer: 'Liya Bekele', status: 'Warning', note: 'High usage detected' },
      { id: 'ESP32-042', customer: 'Meron Alemu', status: 'Offline', note: 'No sync for 22 mins' },
    ];

    const ticketQueue: Ticket[] = [
      { id: 'TCK-1005', issue: 'Poor water quality', priority: 'High' },
      { id: 'TCK-1006', issue: 'Valve not responding', priority: 'High' },
      { id: 'TCK-1007', issue: 'Billing dispute', priority: 'Medium' },
    ];

    return {
      systemStatus: 'System Stable',
      summaryCards,
      recentDevices,
      ticketQueue,
      updatedAt: new Date().toISOString(),
    };
  }

  getMobileHome() {
    const cards: MobileStatusCard[] = [
      {
        title: 'Water Quality',
        value: 'Safe',
        subtitle: 'Turbidity: 2.1 NTU',
        tone: 'success',
      },
      {
        title: 'Current Usage',
        value: '12.4 L/min',
        subtitle: 'Today: 148 L',
        tone: 'info',
      },
      {
        title: 'Valve State',
        value: 'Open',
        subtitle: 'Remote control enabled',
        tone: 'warning',
      },
      {
        title: 'Outstanding Bill',
        value: 'ETB 420',
        subtitle: 'Due in 5 days',
        tone: 'danger',
      },
    ];

    return {
      customerName: 'Abel Tesfaye',
      connectionStatus: 'Online',
      meterId: 'ESP32-001',
      cards,
      alerts: [
        'Water quality is within the safe range.',
        'Next bill due in 5 days.',
      ],
      updatedAt: new Date().toISOString(),
    };
  }
}
