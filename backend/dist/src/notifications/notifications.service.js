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
    async onModuleInit() {
        try {
            await this.repo.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'userId') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
                ALTER TABLE notifications ADD COLUMN "userId" varchar;
                UPDATE notifications SET "userId" = user_id WHERE "userId" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "userId" varchar;
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'relatedId') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_id') THEN
                ALTER TABLE notifications ADD COLUMN "relatedId" varchar;
                UPDATE notifications SET "relatedId" = related_id WHERE "relatedId" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "relatedId" varchar;
              END IF;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'createdAt') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
                ALTER TABLE notifications ADD COLUMN "createdAt" timestamp DEFAULT now();
                UPDATE notifications SET "createdAt" = created_at WHERE "createdAt" IS NULL;
              ELSE
                ALTER TABLE notifications ADD COLUMN "createdAt" timestamp DEFAULT now();
              END IF;
            END IF;
          END IF;
        END $$;
      `);
        }
        catch {
        }
    }
    async findForUser(userId, audience) {
        try {
            return await this.repo.find({
                where: { userId, ...(audience ? { audience } : {}) },
                order: { createdAt: 'DESC' },
                take: 100,
            });
        }
        catch {
            try {
                return await this.repo.query(`SELECT * FROM notifications WHERE (user_id = $1 OR "userId" = $1) ${audience ? 'AND audience = $2' : ''} ORDER BY id DESC LIMIT 100`, audience ? [userId, audience] : [userId]);
            }
            catch {
                return [];
            }
        }
    }
    async unreadCount(userId, audience) {
        try {
            return await this.repo.count({
                where: { userId, read: false, ...(audience ? { audience } : {}) },
            });
        }
        catch {
            return 0;
        }
    }
    async create(data) {
        try {
            return await this.repo.save(this.repo.create(data));
        }
        catch (err) {
            console.warn('NotificationsService.create default insert failed:', (err === null || err === void 0 ? void 0 : err.message) || err);
            try {
                const id = data.id || require('crypto').randomUUID();
                const userId = data.userId || data.user_id || '';
                const audience = data.audience || 'customer';
                const type = data.type || 'general';
                const title = data.title || '';
                const message = data.message || '';
                const relatedId = data.relatedId || data.related_id || null;
                await this.repo.query(`INSERT INTO notifications (id, user_id, audience, type, title, message, related_id, read)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false)
           ON CONFLICT DO NOTHING`, [id, userId, audience, type, title, message, relatedId]);
            }
            catch (fallbackErr) {
                console.warn('NotificationsService fallback insert also failed (non-fatal):', (fallbackErr === null || fallbackErr === void 0 ? void 0 : fallbackErr.message) || fallbackErr);
            }
            return null;
        }
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