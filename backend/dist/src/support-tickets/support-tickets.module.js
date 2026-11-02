"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const support_ticket_entity_1 = require("./support-ticket.entity");
const support_tickets_service_1 = require("./support-tickets.service");
const support_tickets_controller_1 = require("./support-tickets.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const technicians_module_1 = require("../technicians/technicians.module");
let SupportTicketsModule = class SupportTicketsModule {
};
exports.SupportTicketsModule = SupportTicketsModule;
exports.SupportTicketsModule = SupportTicketsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([support_ticket_entity_1.SupportTicket]), notifications_module_1.NotificationsModule, technicians_module_1.TechniciansModule],
        controllers: [support_tickets_controller_1.SupportTicketsController],
        providers: [support_tickets_service_1.SupportTicketsService],
        exports: [support_tickets_service_1.SupportTicketsService],
    })
], SupportTicketsModule);
//# sourceMappingURL=support-tickets.module.js.map