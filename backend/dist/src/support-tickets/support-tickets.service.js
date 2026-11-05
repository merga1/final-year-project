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
exports.SupportTicketsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const support_ticket_entity_1 = require("./support-ticket.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const technicians_service_1 = require("../technicians/technicians.service");
let SupportTicketsService = class SupportTicketsService {
    constructor(repo, notifications, technicians) {
        this.repo = repo;
        this.notifications = notifications;
        this.technicians = technicians;
    }
    async onModuleInit() {
        try {
            await this.repo.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'support_tickets' AND column_name = 'subject'
          ) THEN
            ALTER TABLE support_tickets ALTER COLUMN subject DROP NOT NULL;
          END IF;
        END $$;
      `).catch(() => { });
        }
        catch {
        }
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const ticket = await this.repo.findOneBy({ id });
        if (!ticket)
            throw new common_1.NotFoundException(`Ticket ${id} not found`);
        return ticket;
    }
    findByCustomer(customerId) {
        return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    }
    findByTechnician(technicianId, status) {
        return this.repo.find({
            where: { technicianId, ...(status ? { status: status } : {}) },
            order: { createdAt: 'DESC' },
        });
    }
    async findOneForTechnician(id, technicianId) {
        const ticket = await this.repo.findOneBy({ id, technicianId });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found or not assigned to you');
        return ticket;
    }
    create(data) {
        const ticket = this.repo.create({
            ...data,
            subject: data.subject || data.issue || data.description || 'Support Ticket',
        });
        return this.repo.save(ticket);
    }
    async createAdminTicket(data) {
        var _a;
        let technicianName = data.technicianName;
        if (data.technicianId && !technicianName) {
            const tech = await this.technicians.findOne(data.technicianId).catch(() => null);
            if (tech)
                technicianName = tech.name;
        }
        const status = data.technicianId ? 'assigned' : (data.status || 'pending');
        const now = new Date();
        const ticket = this.repo.create({
            ...data,
            status,
            subject: data.subject || data.issue || data.description || 'Alert Escalation',
            technicianName: technicianName || null,
            assignedAt: data.technicianId ? now : null,
            statusHistory: JSON.stringify([{ status, at: now.toISOString(), note: 'Created by Admin from Alert dispatch' }]),
        });
        const saved = await this.repo.save(ticket);
        if (data.technicianId) {
            await this.technicians.update(data.technicianId, { currentJobCount: () => 'currentJobCount + 1' }).catch(() => { });
            await this.notifications.create({
                userId: data.technicianId,
                audience: 'technician',
                type: 'ticket_assignment',
                title: 'New ticket assigned from Alert',
                message: `${saved.type}: ${(_a = saved.description) !== null && _a !== void 0 ? _a : saved.issue}`,
                relatedId: saved.id,
            }).catch(() => { });
        }
        return saved;
    }
    async createCustomerTicket(data) {
        var _a;
        const technician = await this.technicians.findLeastBusy().catch(() => null);
        const now = new Date();
        const ticket = this.repo.create({
            ...data,
            status: technician ? 'in_progress' : 'pending',
            subject: data.subject || data.issue || data.description || 'Customer Support',
            technicianId: technician === null || technician === void 0 ? void 0 : technician.id,
            technicianName: technician === null || technician === void 0 ? void 0 : technician.name,
            assignedAt: technician ? now : undefined,
            statusHistory: JSON.stringify([{ status: technician ? 'in_progress' : 'pending', at: now.toISOString() }]),
        });
        const saved = await this.repo.save(ticket);
        if (technician) {
            await this.technicians.update(technician.id, { currentJobCount: (technician.currentJobCount || 0) + 1 }).catch(() => { });
            await this.notifications.create({
                userId: technician.id,
                audience: 'technician',
                type: 'ticket_assignment',
                title: 'New ticket assigned',
                message: `${saved.type}: ${(_a = saved.description) !== null && _a !== void 0 ? _a : saved.issue}`,
                relatedId: saved.id,
            }).catch(() => { });
            if (saved.customerId) {
                await this.notifications.create({
                    userId: saved.customerId,
                    audience: 'customer',
                    type: 'ticket_assignment',
                    title: 'Technician assigned',
                    message: `${technician.name} is assigned to your support ticket.`,
                    relatedId: saved.id,
                }).catch(() => { });
            }
        }
        return saved;
    }
    async update(id, data) {
        var _a, _b;
        const before = await this.repo.findOneBy({ id });
        if (!before)
            throw new common_1.NotFoundException('Ticket not found');
        const updatePayload = {};
        const reasonText = data.reassignReason || data.reason || data.notes;
        if (reasonText) {
            updatePayload.notes = reasonText;
            let historyArr = [];
            try {
                if (before.statusHistory) {
                    historyArr = JSON.parse(before.statusHistory);
                    if (!Array.isArray(historyArr))
                        historyArr = [{ entry: before.statusHistory }];
                }
            }
            catch {
                historyArr = [{ entry: before.statusHistory }];
            }
            historyArr.push({
                status: data.status || before.status,
                note: reasonText,
                at: new Date().toISOString(),
            });
            updatePayload.statusHistory = JSON.stringify(historyArr);
        }
        if (data.technicianId !== undefined) {
            updatePayload.technicianId = data.technicianId;
            if (data.technicianId) {
                try {
                    const newTech = await this.technicians.findOne(data.technicianId).catch(() => null);
                    if (newTech) {
                        updatePayload.technicianName = newTech.name;
                        updatePayload.assignedAt = new Date();
                        if (before.technicianId !== data.technicianId) {
                            await this.technicians.update(newTech.id, {
                                currentJobCount: (newTech.currentJobCount || 0) + 1,
                            }).catch(() => null);
                        }
                    }
                }
                catch (techErr) {
                    console.warn('Could not load technician details:', techErr);
                }
                if (before.technicianId && before.technicianId !== data.technicianId) {
                    try {
                        const oldTech = await this.technicians.findOne(before.technicianId).catch(() => null);
                        if (oldTech && (oldTech.currentJobCount || 0) > 0) {
                            await this.technicians.update(oldTech.id, {
                                currentJobCount: Math.max(0, oldTech.currentJobCount - 1),
                            }).catch(() => null);
                        }
                    }
                    catch {
                    }
                }
            }
            else {
                updatePayload.technicianName = null;
                updatePayload.assignedAt = null;
            }
        }
        else if (data.technicianName !== undefined) {
            updatePayload.technicianName = data.technicianName;
        }
        if (data.status !== undefined) {
            updatePayload.status = data.status;
            if (data.status === 'resolved' && !before.resolvedAt) {
                updatePayload.resolvedAt = new Date();
            }
            if (data.status === 'accepted' && !before.acceptedAt) {
                updatePayload.acceptedAt = new Date();
            }
        }
        if (data.priority !== undefined)
            updatePayload.priority = data.priority;
        if (data.type !== undefined)
            updatePayload.type = data.type;
        if (data.issue !== undefined)
            updatePayload.issue = data.issue;
        if (data.subject !== undefined)
            updatePayload.subject = data.subject;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.progressNotes !== undefined)
            updatePayload.progressNotes = data.progressNotes;
        if (data.rejectionReason !== undefined)
            updatePayload.rejectionReason = data.rejectionReason;
        if (data.customerAddress !== undefined)
            updatePayload.customerAddress = data.customerAddress;
        if (data.deviceId !== undefined)
            updatePayload.deviceId = data.deviceId;
        await this.repo.update(id, updatePayload);
        const after = await this.repo.findOneBy({ id });
        if (after && (data.technicianId || data.status) && after.customerId) {
            try {
                await this.notifications.create({
                    userId: after.customerId,
                    audience: 'customer',
                    type: data.technicianId ? 'ticket_assignment' : 'ticket_status',
                    title: data.technicianId ? 'Ticket updated' : 'Ticket status updated',
                    message: data.technicianId
                        ? `${(_a = after.technicianName) !== null && _a !== void 0 ? _a : 'A technician'} is assigned to your ticket.`
                        : `Your ticket is now ${after.status}.`,
                    relatedId: after.id,
                }).catch(() => { });
            }
            catch {
            }
        }
        if ((after === null || after === void 0 ? void 0 : after.technicianId) && data.technicianId) {
            try {
                await this.notifications.create({
                    userId: after.technicianId,
                    audience: 'technician',
                    type: 'ticket_assignment',
                    title: 'Ticket assigned',
                    message: `${after.type}: ${(_b = after.description) !== null && _b !== void 0 ? _b : after.issue}`,
                    relatedId: after.id,
                }).catch(() => { });
            }
            catch {
            }
        }
        return after;
    }
    async transitionForTechnician(id, technicianId, data) {
        var _a, _b, _c, _d, _e;
        const ticket = await this.findOneForTechnician(id, technicianId);
        const requested = data.status.toLowerCase();
        const now = new Date();
        const current = ticket.status.toLowerCase();
        if (requested === 'accepted' && !['assigned', 'open', 'pending'].includes(current)) {
            throw new common_1.BadRequestException('Only an assigned ticket can be accepted');
        }
        if (requested === 'rejected') {
            if (!((_a = data.rejectionReason) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new common_1.BadRequestException('A rejection reason is required');
            ticket.status = 'pending';
            ticket.rejectionReason = data.rejectionReason.trim();
            ticket.technicianId = null;
            ticket.technicianName = null;
            ticket.assignedAt = null;
            await this.decrementWorkload(technicianId, false);
        }
        else if (requested === 'resolved') {
            if (!['accepted', 'in_progress'].includes(current))
                throw new common_1.BadRequestException('Accept the ticket before resolving it');
            if (!((_b = data.notes) === null || _b === void 0 ? void 0 : _b.trim()))
                throw new common_1.BadRequestException('Resolution notes are required');
            ticket.status = 'resolved';
            ticket.notes = data.notes.trim();
            ticket.progressNotes = ((_c = data.progressNotes) === null || _c === void 0 ? void 0 : _c.trim()) || ticket.progressNotes;
            ticket.resolvedAt = now;
            await this.decrementWorkload(technicianId, true);
        }
        else if (requested === 'closed') {
            if (current !== 'resolved')
                throw new common_1.BadRequestException('Only resolved tickets can be closed');
            ticket.status = 'closed';
        }
        else if (requested === 'accepted' || requested === 'in_progress') {
            ticket.status = 'in_progress';
            ticket.acceptedAt = (_d = ticket.acceptedAt) !== null && _d !== void 0 ? _d : now;
            if ((_e = data.progressNotes) === null || _e === void 0 ? void 0 : _e.trim())
                ticket.progressNotes = data.progressNotes.trim();
        }
        else {
            throw new common_1.BadRequestException('Unsupported ticket status transition');
        }
        let history = [];
        try {
            history = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
            if (!Array.isArray(history))
                history = [{ entry: ticket.statusHistory }];
        }
        catch {
            history = [{ entry: ticket.statusHistory }];
        }
        history.push({ status: ticket.status, at: now.toISOString(), by: technicianId });
        ticket.statusHistory = JSON.stringify(history);
        const saved = await this.repo.save(ticket);
        await this.notifications.create({
            userId: saved.customerId,
            audience: 'customer',
            type: 'ticket_status',
            title: 'Support ticket updated',
            message: `Your ticket is now ${saved.status}.`,
            relatedId: saved.id,
        }).catch(() => { });
        return saved;
    }
    async decrementWorkload(technicianId, completed) {
        var _a;
        const technician = await this.technicians.findOne(technicianId);
        await this.technicians.update(technicianId, {
            currentJobCount: Math.max(0, ((_a = technician.currentJobCount) !== null && _a !== void 0 ? _a : 0) - 1),
            completedRepairs: technician.completedRepairs + (completed ? 1 : 0),
        });
    }
    count() {
        return this.repo.count();
    }
    countOpen() {
        return this.repo.createQueryBuilder('ticket')
            .where('ticket.status NOT IN (:...done)', { done: ['resolved', 'closed', 'cancelled'] })
            .getCount();
    }
    countByStatus(status) {
        return this.repo.countBy({ status: status });
    }
};
exports.SupportTicketsService = SupportTicketsService;
exports.SupportTicketsService = SupportTicketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(support_ticket_entity_1.SupportTicket)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        technicians_service_1.TechniciansService])
], SupportTicketsService);
//# sourceMappingURL=support-tickets.service.js.map