"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const customers_module_1 = require("./customers/customers.module");
const devices_module_1 = require("./devices/devices.module");
const readings_module_1 = require("./readings/readings.module");
const billing_module_1 = require("./billing/billing.module");
const payments_module_1 = require("./payments/payments.module");
const alerts_module_1 = require("./alerts/alerts.module");
const support_tickets_module_1 = require("./support-tickets/support-tickets.module");
const technicians_module_1 = require("./technicians/technicians.module");
const notifications_module_1 = require("./notifications/notifications.module");
const audit_module_1 = require("./audit/audit.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            customers_module_1.CustomersModule,
            devices_module_1.DevicesModule,
            readings_module_1.ReadingsModule,
            billing_module_1.BillingModule,
            payments_module_1.PaymentsModule,
            alerts_module_1.AlertsModule,
            support_tickets_module_1.SupportTicketsModule,
            technicians_module_1.TechniciansModule,
            notifications_module_1.NotificationsModule,
            audit_module_1.AuditModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map