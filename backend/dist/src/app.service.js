"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers/customers.service");
const devices_service_1 = require("./devices/devices.service");
const billing_service_1 = require("./billing/billing.service");
const alerts_service_1 = require("./alerts/alerts.service");
const support_tickets_service_1 = require("./support-tickets/support-tickets.service");
const payments_service_1 = require("./payments/payments.service");
const readings_service_1 = require("./readings/readings.service");
const technicians_service_1 = require("./technicians/technicians.service");
let AppService = class AppService {
    constructor(customers, devices, billing, alerts, tickets, payments, readings, technicians) {
        this.customers = customers;
        this.devices = devices;
        this.billing = billing;
        this.alerts = alerts;
        this.tickets = tickets;
        this.payments = payments;
        this.readings = readings;
        this.technicians = technicians;
    }
    getHealth() {
        return {
            status: 'ok',
            service: 'smart-water-backend',
            timestamp: new Date().toISOString(),
        };
    }
    async getAdminOverview() {
        const [totalCustomers, activeCustomers, totalDevices, onlineDevices, totalTickets, openTickets, criticalAlerts, totalTechnicians, topTechnicians, pendingBills, overdueCount, verifiedToday, pendingPayments, totalCollected, totalPending, recentDevices, ticketQueue,] = await Promise.all([
            this.customers.count(),
            this.customers.countByStatus('active'),
            this.devices.count(),
            this.devices.countByConnectivity('ONLINE'),
            this.tickets.count(),
            this.tickets.countOpen(),
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
    async getMobileHome(userId, meterId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
                value: (_a = device === null || device === void 0 ? void 0 : device.valveState) !== null && _a !== void 0 ? _a : 'N/A',
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
        const latestTimestamp = (_c = (_b = latestReading === null || latestReading === void 0 ? void 0 : latestReading.timestamp) !== null && _b !== void 0 ? _b : device === null || device === void 0 ? void 0 : device.lastSeenAt) !== null && _c !== void 0 ? _c : null;
        const staleAfterMs = 60000;
        const isOffline = !latestTimestamp || Date.now() - new Date(latestTimestamp).getTime() > staleAfterMs || (device === null || device === void 0 ? void 0 : device.connectivity) === 'OFFLINE';
        return {
            userId: customer.id,
            customerName: customer.name,
            customerEmail: customer.email,
            connectionStatus: isOffline ? 'OFFLINE' : (_d = device === null || device === void 0 ? void 0 : device.connectivity) !== null && _d !== void 0 ? _d : 'ONLINE',
            meterId: (_e = device === null || device === void 0 ? void 0 : device.meterId) !== null && _e !== void 0 ? _e : 'ESP32-001',
            flowRateLpm: (_f = latestReading === null || latestReading === void 0 ? void 0 : latestReading.flowRateLpm) !== null && _f !== void 0 ? _f : 0.0,
            turbidityNtu: (_g = latestReading === null || latestReading === void 0 ? void 0 : latestReading.turbidityNtu) !== null && _g !== void 0 ? _g : 0.0,
            monthlyConsumptionLiters: (_h = latestReading === null || latestReading === void 0 ? void 0 : latestReading.totalUsageLiters) !== null && _h !== void 0 ? _h : 0,
            dailyConsumptionLiters: (_j = latestReading === null || latestReading === void 0 ? void 0 : latestReading.totalUsageLiters) !== null && _j !== void 0 ? _j : 0,
            waterQualityStatus: latestReading ? (latestReading.turbidityNtu <= 5 ? 'Safe' : latestReading.turbidityNtu <= 15 ? 'Warning' : 'Contaminated') : 'Unknown',
            lastUpdatedAt: latestTimestamp,
            deviceOffline: isOffline,
            valveState: (_k = device === null || device === void 0 ? void 0 : device.valveState) !== null && _k !== void 0 ? _k : 'OPEN',
            cards,
            alerts: await this.alerts.findByMeterId(meterId !== null && meterId !== void 0 ? meterId : ''),
            updatedAt: new Date().toISOString(),
        };
    }
    async getTechnicianHome(technicianId) {
        const tickets = await this.tickets.findByTechnician(technicianId);
        return {
            assigned: tickets.filter((t) => ['assigned', 'open', 'pending'].includes(t.status.toLowerCase())).length,
            accepted: tickets.filter((t) => ['accepted', 'in_progress'].includes(t.status.toLowerCase())).length,
            resolved: tickets.filter((t) => ['resolved', 'closed'].includes(t.status.toLowerCase())).length,
            total: tickets.length,
            updatedAt: new Date().toISOString(),
        };
    }
    async getTechnicianDevice(ticketId, technicianId) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const ticket = await this.tickets.findOneForTechnician(ticketId, technicianId);
        const device = ticket.deviceId
            ? await this.devices.findOne(ticket.deviceId)
            : ticket.customerId
                ? await this.devices.findAll().then((items) => items.find((item) => item.customerId === ticket.customerId))
                : null;
        const meterId = device === null || device === void 0 ? void 0 : device.meterId;
        const [reading, alerts] = meterId
            ? await Promise.all([this.readings.findLatestByMeterId(meterId), this.alerts.findByMeterId(meterId)])
            : [null, []];
        return {
            ticketId: ticket.id,
            deviceId: (_a = device === null || device === void 0 ? void 0 : device.id) !== null && _a !== void 0 ? _a : null,
            meterId: meterId !== null && meterId !== void 0 ? meterId : null,
            flowRateLpm: (_b = reading === null || reading === void 0 ? void 0 : reading.flowRateLpm) !== null && _b !== void 0 ? _b : 0,
            turbidityNtu: (_c = reading === null || reading === void 0 ? void 0 : reading.turbidityNtu) !== null && _c !== void 0 ? _c : 0,
            valveState: (_e = (_d = reading === null || reading === void 0 ? void 0 : reading.valveState) !== null && _d !== void 0 ? _d : device === null || device === void 0 ? void 0 : device.valveState) !== null && _e !== void 0 ? _e : 'UNKNOWN',
            connectivity: (_f = device === null || device === void 0 ? void 0 : device.connectivity) !== null && _f !== void 0 ? _f : 'UNKNOWN',
            lastUpdatedAt: (_h = (_g = reading === null || reading === void 0 ? void 0 : reading.timestamp) !== null && _g !== void 0 ? _g : device === null || device === void 0 ? void 0 : device.lastSeenAt) !== null && _h !== void 0 ? _h : null,
            alerts,
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customers_service_1.CustomersService,
        devices_service_1.DevicesService,
        billing_service_1.BillingService,
        alerts_service_1.AlertsService,
        support_tickets_service_1.SupportTicketsService,
        payments_service_1.PaymentsService,
        readings_service_1.ReadingsService,
        technicians_service_1.TechniciansService])
], AppService);
//# sourceMappingURL=app.service.js.map