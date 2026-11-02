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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const devices_service_1 = require("./devices.service");
const readings_service_1 = require("../readings/readings.service");
const alerts_service_1 = require("../alerts/alerts.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const common_2 = require("@nestjs/common");
const notifications_service_1 = require("../notifications/notifications.service");
let DevicesController = class DevicesController {
    constructor(devicesService, readingsService, alertsService, notifications) {
        this.devicesService = devicesService;
        this.readingsService = readingsService;
        this.alertsService = alertsService;
        this.notifications = notifications;
    }
    async toggleValve(user, body) {
        var _a;
        const meterId = user.meterId;
        if (!meterId) {
            throw new common_2.BadRequestException('No smart water meter assigned to this account');
        }
        const device = await this.devicesService.findByMeterId(meterId);
        if (!device) {
            throw new common_2.BadRequestException(`Device for meter ${meterId} not found`);
        }
        if (device.connectivity === 'OFFLINE') {
            throw new common_2.BadRequestException('This device is offline. Reconnect it before changing the valve.');
        }
        const nextState = (_a = body.valveState) !== null && _a !== void 0 ? _a : (device.valveState === 'OPEN' ? 'CLOSED' : 'OPEN');
        const command = await this.devicesService.createValveCommand({
            customerId: user.sub,
            meterId,
            requestedState: nextState,
            status: 'pending',
        });
        await this.devicesService.updateByMeterId(meterId, { valveState: nextState });
        command.status = 'confirmed';
        command.confirmedAt = new Date();
        await this.devicesService.createValveCommand(command);
        return {
            success: true,
            commandId: command.id,
            pending: false,
            meterId,
            valveState: nextState,
            message: `Valve remotely set to ${nextState}`,
        };
    }
    findAll() {
        return this.devicesService.findAll();
    }
    create(body) {
        return this.devicesService.create(body);
    }
    async findOne(id) {
        var _a;
        const device = (_a = (await this.devicesService.findByMeterId(id))) !== null && _a !== void 0 ? _a : (await this.devicesService.findOne(id).catch(() => null));
        if (!device)
            throw new common_2.BadRequestException(`Device ${id} not found`);
        return device;
    }
    async activate(id) {
        var _a;
        const device = (_a = (await this.devicesService.findByMeterId(id))) !== null && _a !== void 0 ? _a : (await this.devicesService.findOne(id).catch(() => null));
        if (!device)
            throw new common_2.BadRequestException(`Device ${id} not found`);
        await this.devicesService.updateByMeterId(device.meterId, { connectivity: 'ONLINE' });
        return { success: true, message: 'Device activated', connectivity: 'ONLINE' };
    }
    async deactivate(id) {
        var _a;
        const device = (_a = (await this.devicesService.findByMeterId(id))) !== null && _a !== void 0 ? _a : (await this.devicesService.findOne(id).catch(() => null));
        if (!device)
            throw new common_2.BadRequestException(`Device ${id} not found`);
        await this.devicesService.updateByMeterId(device.meterId, { connectivity: 'OFFLINE' });
        return { success: true, message: 'Device deactivated', connectivity: 'OFFLINE' };
    }
    async ingestReading(body) {
        const { deviceId, meterId, flowRateLpm, totalUsageLiters, turbidityNtu, valveState, connectivity, batteryPercent } = body;
        const device = await this.devicesService.findByMeterId(meterId);
        const reading = await this.readingsService.create({
            deviceId, meterId, flowRateLpm, totalUsageLiters,
            turbidityNtu, valveState, connectivity, batteryPercent,
        });
        await this.devicesService.updateByMeterId(meterId, {
            connectivity,
            valveState,
            batteryPercent,
            lastSeenAt: new Date(),
        });
        if (turbidityNtu > 5) {
            await this.alertsService.createIfNotRecent(meterId, deviceId, 'WATER_QUALITY', `Turbidity ${turbidityNtu} NTU exceeds 5 NTU threshold`, 'critical');
            if (device === null || device === void 0 ? void 0 : device.customerId) {
                await this.notifications.create({
                    userId: device.customerId,
                    audience: 'customer',
                    type: 'high_turbidity',
                    title: 'Water quality warning',
                    message: `Turbidity is ${turbidityNtu} NTU. Please avoid using the water until it is safe.`,
                    relatedId: device.id,
                });
            }
        }
        if (flowRateLpm > 30) {
            await this.alertsService.createIfNotRecent(meterId, deviceId, 'HIGH_USAGE', `Flow rate ${flowRateLpm} L/min is above normal`, 'warning');
            if (device === null || device === void 0 ? void 0 : device.customerId) {
                await this.notifications.create({
                    userId: device.customerId,
                    audience: 'customer',
                    type: 'high_flow',
                    title: 'High water flow detected',
                    message: `Flow rate is ${flowRateLpm} L/min. Check for a possible leak.`,
                    relatedId: device.id,
                });
            }
        }
        if (batteryPercent < 15) {
            await this.alertsService.createIfNotRecent(meterId, deviceId, 'LOW_BATTERY', `Battery at ${batteryPercent}%`, 'warning');
        }
        return reading;
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)('api/mobile/valve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "toggleValve", null);
__decorate([
    (0, common_1.Get)('api/admin/devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('api/admin/devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DevicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('api/admin/devices/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('api/admin/devices/:id/activate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)('api/admin/devices/:id/deactivate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)('api/devices/reading'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "ingestReading", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService,
        readings_service_1.ReadingsService,
        alerts_service_1.AlertsService,
        notifications_service_1.NotificationsService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map