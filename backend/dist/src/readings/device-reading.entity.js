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
exports.DeviceReading = void 0;
const typeorm_1 = require("typeorm");
let DeviceReading = class DeviceReading {
};
exports.DeviceReading = DeviceReading;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeviceReading.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeviceReading.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeviceReading.prototype, "meterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 0 }),
    __metadata("design:type", Number)
], DeviceReading.prototype, "flowRateLpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 0 }),
    __metadata("design:type", Number)
], DeviceReading.prototype, "totalUsageLiters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 0 }),
    __metadata("design:type", Number)
], DeviceReading.prototype, "turbidityNtu", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'OPEN' }),
    __metadata("design:type", String)
], DeviceReading.prototype, "valveState", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ONLINE' }),
    __metadata("design:type", String)
], DeviceReading.prototype, "connectivity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 100 }),
    __metadata("design:type", Number)
], DeviceReading.prototype, "batteryPercent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeviceReading.prototype, "timestamp", void 0);
exports.DeviceReading = DeviceReading = __decorate([
    (0, typeorm_1.Entity)('device_readings')
], DeviceReading);
//# sourceMappingURL=device-reading.entity.js.map