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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
let NotificationsService = class NotificationsService {
    constructor(repo) {
        this.repo = repo;
    }
    findForUser(userId, audience) {
        return this.repo.find({
            where: { userId, ...(audience ? { audience } : {}) },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    unreadCount(userId, audience) {
        return this.repo.count({
            where: { userId, read: false, ...(audience ? { audience } : {}) },
        });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async markRead(id, userId) {
        const notification = await this.repo.findOneBy({ id, userId });
        if (!notification)
            throw new common_1.NotFoundException('Notification not found');
        notification.read = true;
        return this.repo.save(notification);
    }
    async markAllRead(userId) {
        await this.repo.update({ userId, read: false }, { read: true });
        return { success: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map