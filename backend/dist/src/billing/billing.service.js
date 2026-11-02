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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bill_entity_1 = require("./bill.entity");
let BillingService = class BillingService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findByCustomer(customerId) {
        return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    }
    create(data) {
        const bill = this.repo.create(data);
        return this.repo.save(bill);
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