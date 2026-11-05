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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alert_entity_1 = require("./alert.entity");
let AlertsService = class AlertsService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findUnacknowledged() {
        return this.repo.find({ where: { acknowledged: false }, order: { createdAt: 'DESC' } });
    }
    findByMeterId(meterId) {
        return this.repo.find({ where: { meterId }, order: { createdAt: 'DESC' }, take: 20 });
    }
    count() {
        return this.repo.count();
    }
    countUnacknowledged() {
        return this.repo.countBy({ acknowledged: false });
    }
    countCriticalToday() {
        return this.repo.count({ where: { severity: 'critical', acknowledged: false } });
    }
    async acknowledge(id, adminName) {
        await this.repo.update(id, { acknowledged: true, acknowledgedBy: adminName });
        return this.repo.findOneBy({ id });
    }
    async create(data) {
        const alert = this.repo.create(data);
        return this.repo.save(alert);
    }
    async createIfNotRecent(meterId, deviceId, type, message, severity) {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const existing = await this.repo.findOne({
            where: { meterId, type, acknowledged: false },
            order: { createdAt: 'DESC' },
        });
        if (existing && existing.createdAt > thirtyMinutesAgo) {
            return null;
        }
        return this.create({ meterId, deviceId, type, message, severity });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map