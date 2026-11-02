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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./payment.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let PaymentsService = class PaymentsService {
    constructor(repo, notifications) {
        this.repo = repo;
        this.notifications = notifications;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findByCustomer(customerId) {
        return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    }
    create(data) {
        const payment = this.repo.create(data);
        return this.repo.save(payment);
    }
    async createChapaPayment(data) {
        var _a, _b;
        const payment = await this.repo.save(this.repo.create({
            ...data,
            method: 'chapa',
            status: 'pending',
            reference: (_a = data.reference) !== null && _a !== void 0 ? _a : `CHAPA-${Date.now()}`,
        }));
        await this.notifications.create({
            userId: payment.customerId,
            audience: 'customer',
            type: 'payment_pending',
            title: 'Payment started',
            message: `Your Chapa payment of ETB ${payment.amount.toFixed(2)} is pending confirmation.`,
            relatedId: payment.id,
        });
        return {
            payment,
            checkoutUrl: (_b = process.env.CHAPA_CHECKOUT_URL) !== null && _b !== void 0 ? _b : null,
            message: process.env.CHAPA_CHECKOUT_URL
                ? 'Continue in the secure Chapa checkout.'
                : 'Chapa checkout is not configured in this environment. The payment was saved as pending.',
        };
    }
    countByStatus(status) {
        return this.repo.countBy({ status: status });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map