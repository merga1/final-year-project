import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
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
    getMobileHome(user: any): Promise<{
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
    getTechnicianHome(user: any): Promise<{
        assigned: number;
        accepted: number;
        resolved: number;
        total: number;
        updatedAt: string;
    }>;
    getTechnicianDevice(user: any, ticketId: string): Promise<{
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
