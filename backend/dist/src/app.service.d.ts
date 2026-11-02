import { CustomersService } from './customers/customers.service';
import { DevicesService } from './devices/devices.service';
import { BillingService } from './billing/billing.service';
import { AlertsService } from './alerts/alerts.service';
import { SupportTicketsService } from './support-tickets/support-tickets.service';
import { PaymentsService } from './payments/payments.service';
import { ReadingsService } from './readings/readings.service';
import { TechniciansService } from './technicians/technicians.service';
export declare class AppService {
    private readonly customers;
    private readonly devices;
    private readonly billing;
    private readonly alerts;
    private readonly tickets;
    private readonly payments;
    private readonly readings;
    private readonly technicians;
    constructor(customers: CustomersService, devices: DevicesService, billing: BillingService, alerts: AlertsService, tickets: SupportTicketsService, payments: PaymentsService, readings: ReadingsService, technicians: TechniciansService);
    getHealth(): {
        status: string;
        service: string;
        timestamp: string;
    };
    getAdminOverview(): Promise<{
        systemStatus: string;
        stats: {
            totalCustomers: number;
            totalTechnicians: number;
            criticalAlerts: number;
            totalTickets: number;
        };
        topTechnicians: {
            id: string;
            name: string;
            repairs: number;
        }[];
        summaryCards: {
            label: string;
            value: string;
        }[];
        detailCards: {
            label: string;
            value: string;
        }[];
        recentDevices: {
            id: string;
            customer: string;
            status: string;
            note: string;
        }[];
        ticketQueue: {
            id: string;
            issue: string;
            priority: import("./support-tickets/support-ticket.entity").TicketPriority;
            status: import("./support-tickets/support-ticket.entity").TicketStatus;
        }[];
        updatedAt: string;
    }>;
    getMobileHome(userId: string, meterId?: string): Promise<{
        userId: string;
        customerName: string;
        customerEmail: string;
        connectionStatus: import("./devices/device.entity").Connectivity;
        meterId: string;
        flowRateLpm: number;
        turbidityNtu: number;
        monthlyConsumptionLiters: number;
        dailyConsumptionLiters: number;
        waterQualityStatus: string;
        lastUpdatedAt: Date | null;
        deviceOffline: boolean;
        valveState: import("./devices/device.entity").ValveState;
        cards: {
            title: string;
            value: string;
            subtitle: string;
            tone: string;
        }[];
        alerts: import("./alerts/alert.entity").Alert[];
        updatedAt: string;
    }>;
    getTechnicianHome(technicianId: string): Promise<{
        assigned: number;
        accepted: number;
        resolved: number;
        total: number;
        updatedAt: string;
    }>;
    getTechnicianDevice(ticketId: string, technicianId: string): Promise<{
        ticketId: string;
        deviceId: string | null;
        meterId: string | null;
        flowRateLpm: number;
        turbidityNtu: number;
        valveState: string;
        connectivity: string;
        lastUpdatedAt: Date | null;
        alerts: import("./alerts/alert.entity").Alert[];
    }>;
}
