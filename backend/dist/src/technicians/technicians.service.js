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
exports.TechniciansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const technician_entity_1 = require("./technician.entity");
const bcrypt = require("bcrypt");
let TechniciansService = class TechniciansService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findByEmail(email) {
        return this.repo.findOneBy({ email: email.trim().toLowerCase() });
    }
    async findOne(id) {
        const tech = await this.repo.findOneBy({ id });
        if (!tech)
            throw new common_1.NotFoundException(`Technician ${id} not found`);
        return tech;
    }
    async create(dto) {
        const name = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();
        const tech = this.repo.create({
            ...dto,
            name: name || 'Technician',
            email: dto.email.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(dto.password || 'technician123', 10),
            specialization: dto.specialization || 'No specialization',
            status: 'on_duty',
            accountStatus: 'active',
            currentJobCount: 0,
            completedRepairs: 0,
        });
        return this.repo.save(tech);
    }
    async update(id, data) {
        var _a, _b, _c, _d;
        await this.findOne(id);
        if (data.firstName || data.lastName) {
            const existing = await this.findOne(id);
            const first = (_b = (_a = data.firstName) !== null && _a !== void 0 ? _a : existing.firstName) !== null && _b !== void 0 ? _b : '';
            const last = (_d = (_c = data.lastName) !== null && _c !== void 0 ? _c : existing.lastName) !== null && _d !== void 0 ? _d : '';
            data.name = `${first} ${last}`.trim();
        }
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    findTop(limit = 5) {
        return this.repo.find({
            order: { completedRepairs: 'DESC' },
            take: limit,
        });
    }
    count() {
        return this.repo.count();
    }
    countByStatus(status) {
        return this.repo.countBy({ status: status });
    }
    findLeastBusy() {
        return this.repo.findOne({
            where: { status: 'on_duty', accountStatus: 'active' },
            order: { currentJobCount: 'ASC', createdAt: 'ASC' },
        });
    }
    async updatePassword(id, passwordHash) {
        await this.findOne(id);
        await this.repo.update(id, { passwordHash });
    }
};
exports.TechniciansService = TechniciansService;
exports.TechniciansService = TechniciansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(technician_entity_1.Technician)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TechniciansService);
//# sourceMappingURL=technicians.service.js.map