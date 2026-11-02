"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const device_entity_1 = require("./device.entity");
const valve_command_entity_1 = require("./valve-command.entity");
const devices_service_1 = require("./devices.service");
const devices_controller_1 = require("./devices.controller");
const readings_module_1 = require("../readings/readings.module");
const alerts_module_1 = require("../alerts/alerts.module");
const notifications_module_1 = require("../notifications/notifications.module");
let DevicesModule = class DevicesModule {
};
exports.DevicesModule = DevicesModule;
exports.DevicesModule = DevicesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([device_entity_1.Device, valve_command_entity_1.ValveCommand]), readings_module_1.ReadingsModule, alerts_module_1.AlertsModule, notifications_module_1.NotificationsModule],
        controllers: [devices_controller_1.DevicesController],
        providers: [devices_service_1.DevicesService],
        exports: [devices_service_1.DevicesService],
    })
], DevicesModule);
//# sourceMappingURL=devices.module.js.map