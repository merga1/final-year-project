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
exports.ReadingsController = void 0;
const common_1 = require("@nestjs/common");
const readings_service_1 = require("./readings.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let ReadingsController = class ReadingsController {
    constructor(service) {
        this.service = service;
    }
    findAll(meterId) {
        return this.service.findByMeterId(meterId || undefined, 100);
    }
    getDailyUsage(meterId) {
        return this.service.getDailyUsage(meterId);
    }
    getZoneUsage() {
        return this.service.getZoneUsage();
    }
    getQualityTrend() {
        return this.service.getQualityTrend();
    }
    getMobileReadings(user) {
        var _a;
        return this.service.findByMeterId((_a = user.meterId) !== null && _a !== void 0 ? _a : '', 20);
    }
    getMobileDailyUsage(user) {
        return this.service.getDailyUsage(user.meterId);
    }
};
exports.ReadingsController = ReadingsController;
__decorate([
    (0, common_1.Get)('api/admin/readings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('meterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('api/admin/readings/daily'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('meterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "getDailyUsage", null);
__decorate([
    (0, common_1.Get)('api/admin/readings/zones'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "getZoneUsage", null);
__decorate([
    (0, common_1.Get)('api/admin/readings/quality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "getQualityTrend", null);
__decorate([
    (0, common_1.Get)('api/mobile/readings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "getMobileReadings", null);
__decorate([
    (0, common_1.Get)('api/mobile/readings/daily'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReadingsController.prototype, "getMobileDailyUsage", null);
exports.ReadingsController = ReadingsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [readings_service_1.ReadingsService])
], ReadingsController);
//# sourceMappingURL=readings.controller.js.map