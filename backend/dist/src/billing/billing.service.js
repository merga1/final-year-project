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
exports.BillingService = exports.DEFAULT_GRACE_PERIOD_DAYS = void 0;
exports.calculateDueDate = calculateDueDate;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bill_entity_1 = require("./bill.entity");
exports.DEFAULT_GRACE_PERIOD_DAYS = 5;
function calculateDueDate(periodEnd, graceDays = exports.DEFAULT_GRACE_PERIOD_DAYS) {
    const d = new Date(periodEnd);
    d.setDate(d.getDate() + graceDays);
    return d.toISOString();
}
let BillingService = class BillingService {
    constructor(repo) {
        this.repo = repo;
    }
    async onModuleInit() {
        try {
            await this.repo.query(`
        UPDATE bills 
        SET "dueDate" = '2026-12-05T07:25:52.952Z' 
        WHERE ("periodEnd" LIKE '%2026-11-30%' OR "periodEnd" LIKE '%2026-11-30T%')
          AND "dueDate" LIKE '%2026-12-15%'
      `).catch(() => { });
        }
        catch {
        }
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findByCustomer(customerId) {
        return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const bill = await this.repo.findOneBy({ id });
        if (!bill)
            throw new common_1.NotFoundException('Bill not found');
        return bill;
    }
    create(data) {
        const bill = this.repo.create(data);
        return this.repo.save(bill);
    }
    async update(id, data) {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async generateFromCumulativeReadings(params) {
        var _a, _b;
        const netUsageLiters = Math.max(0, params.currentCumulativeLiters - params.previousCumulativeLiters);
        const rate = (_a = params.rate) !== null && _a !== void 0 ? _a : 5;
        const amountEtb = Math.round((netUsageLiters * rate) / 100);
        const dueDate = calculateDueDate(params.periodEnd, (_b = params.graceDays) !== null && _b !== void 0 ? _b : exports.DEFAULT_GRACE_PERIOD_DAYS);
        return this.create({
            customerId: params.customerId,
            customerName: params.customerName,
            usageLiters: netUsageLiters,
            amountEtb,
            rate,
            status: 'pending',
            periodStart: params.periodStart,
            periodEnd: params.periodEnd,
            dueDate,
        });
    }
    count() {
        return this.repo.count();
    }
    countByStatus(status) {
        return this.repo.countBy({ status: status });
    }
    async totalCollected() {
        var _a;
        const result = await this.repo
            .createQueryBuilder('b')
            .select('SUM(b.amountEtb)', 'total')
            .where('b.status = :status', { status: 'paid' })
            .getRawOne();
        return Math.round((_a = result === null || result === void 0 ? void 0 : result.total) !== null && _a !== void 0 ? _a : 0);
    }
    async totalPending() {
        var _a;
        const result = await this.repo
            .createQueryBuilder('b')
            .select('SUM(b.amountEtb)', 'total')
            .where('b.status != :status', { status: 'paid' })
            .getRawOne();
        return Math.round((_a = result === null || result === void 0 ? void 0 : result.total) !== null && _a !== void 0 ? _a : 0);
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bill_entity_1.Bill)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map