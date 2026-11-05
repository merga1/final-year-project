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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketsController = void 0;
const common_1 = require("@nestjs/common");
const support_tickets_service_1 = require("./support-tickets.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SupportTicketsController = class SupportTicketsController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    createAdminTicket(body) {
        return this.service.createAdminTicket(body);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    getMobileTickets(user) {
        return this.service.findByCustomer(user.sub);
    }
    createTicket(user, body) {
        return this.service.createCustomerTicket({
            customerId: user.sub,
            customerName: user.name,
            ...body,
        });
    }
    getCustomerTicket(user, id) {
        return this.service.findByCustomer(user.sub).then((tickets) => {
            const ticket = tickets.find((item) => item.id === id);
            if (!ticket)
                throw new common_1.NotFoundException('Ticket not found');
            return ticket;
        });
    }
    getTechnicianTickets(user, status) {
        var _a;
        return this.service.findByTechnician((_a = user.technicianId) !== null && _a !== void 0 ? _a : user.sub, status);
    }
    getTechnicianTicket(user, id) {
        var _a;
        return this.service.findOneForTechnician(id, (_a = user.technicianId) !== null && _a !== void 0 ? _a : user.sub);
    }
    updateTechnicianTicket(user, id, body) {
        var _a;
        return this.service.transitionForTechnician(id, (_a = user.technicianId) !== null && _a !== void 0 ? _a : user.sub, body);
    }
};
exports.SupportTicketsController = SupportTicketsController;
__decorate([
    (0, common_1.Get)('api/admin/support-tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('api/admin/support-tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "createAdminTicket", null);
__decorate([
    (0, common_1.Get)('api/admin/support-tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('api/admin/support-tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('api/mobile/support-tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "getMobileTickets", null);
__decorate([
    (0, common_1.Post)('api/mobile/support-tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('api/mobile/support-tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "getCustomerTicket", null);
__decorate([
    (0, common_1.Get)('api/technician/tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('technician'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "getTechnicianTickets", null);
__decorate([
    (0, common_1.Get)('api/technician/tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('technician'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "getTechnicianTicket", null);
__decorate([
    (0, common_1.Patch)('api/technician/tickets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('technician'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SupportTicketsController.prototype, "updateTechnicianTicket", null);
exports.SupportTicketsController = SupportTicketsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [support_tickets_service_1.SupportTicketsService])
], SupportTicketsController);
//# sourceMappingURL=support-tickets.controller.js.map