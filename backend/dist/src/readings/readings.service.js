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
exports.ReadingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_reading_entity_1 = require("./device-reading.entity");
let ReadingsService = class ReadingsService {
    constructor(repo) {
        this.repo = repo;
    }
    create(data) {
        const reading = this.repo.create(data);
        return this.repo.save(reading);
    }
    findByMeterId(meterId, limit = 50) {
        return this.repo.find({
            where: meterId ? { meterId } : {},
            order: { timestamp: 'DESC' },
            take: limit,
        });
    }
    async getDailyUsage(meterId) {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const qb = this.repo.createQueryBuilder('r')
            .select("date(r.timestamp)", 'day')
            .addSelect('MAX(r.totalUsageLiters) - MIN(r.totalUsageLiters)', 'usageLiters')
            .where('r.timestamp >= :since', { since: since.toISOString() });
        if (meterId) {
            qb.andWhere('r.meterId = :meterId', { meterId });
        }
        qb.groupBy('day').orderBy('day', 'ASC');
        return qb.getRawMany();
    }
    async getZoneUsage() {
        const raw = await this.repo.query(`
      SELECT d.zone,
             ROUND(SUM(sub.usage), 0) as totalLiters,
             ROUND(AVG(sub.avgTurbidity), 2) as avgTurbidity,
             COUNT(DISTINCT d.meterId) as meterCount
      FROM devices d
      JOIN (
        SELECT meterId, (MAX(totalUsageLiters) - MIN(totalUsageLiters)) as usage, AVG(turbidityNtu) as avgTurbidity
        FROM device_readings
        GROUP BY meterId
      ) sub ON sub.meterId = d.meterId
      GROUP BY d.zone
      ORDER BY totalLiters DESC
    `);
        return raw;
    }
    async getQualityTrend() {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const raw = await this.repo.query(`
      SELECT date(timestamp) as day,
             ROUND(AVG(turbidityNtu), 2) as avgTurbidity,
             ROUND(MAX(turbidityNtu), 2) as maxTurbidity,
             ROUND(AVG(flowRateLpm), 1) as avgFlowRate
      FROM device_readings
      WHERE timestamp >= ?
      GROUP BY date(timestamp)
      ORDER BY day ASC
    `, [since.toISOString().slice(0, 10)]);
        return raw;
    }
    findLatestByMeterId(meterId) {
        return this.repo.findOne({
            where: { meterId },
            order: { timestamp: 'DESC' },
        });
    }
};
exports.ReadingsService = ReadingsService;
exports.ReadingsService = ReadingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_reading_entity_1.DeviceReading)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReadingsService);
//# sourceMappingURL=readings.service.js.map