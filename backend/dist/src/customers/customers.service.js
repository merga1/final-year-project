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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const customer_entity_1 = require("./customer.entity");
let CustomersService = class CustomersService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const customer = await this.repo.findOneBy({ id });
        if (!customer)
            throw new common_1.NotFoundException(`Customer ${id} not found`);
        return customer;
    }
    async findByEmail(email) {
        return this.repo.findOneBy({ email: email.trim().toLowerCase() });
    }
    async create(data) {
        var _a;
        const customer = this.repo.create({ ...data, email: (_a = data.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase() });
        return this.repo.save(customer);
    }
    async updatePasswordHash(id, passwordHash) {
        await this.findOne(id);
        await this.repo.update(id, { passwordHash });
    }
    async createFromAdmin(dto) {
        const existing = await this.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();
        const customer = this.repo.create({
            firstName: dto.firstName,
            lastName: dto.lastName,
            name: fullName || 'Customer',
            email: dto.email.trim().toLowerCase(),
            passwordHash,
            dateOfBirth: dto.dateOfBirth,
            address: dto.address,
            meterId: dto.meterId,
            zone: dto.zone || 'Zone A',
            accountStatus: 'active',
            role: 'customer',
        });
        return this.repo.save(customer);
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
        if (data.email)
            data.email = data.email.trim().toLowerCase();
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    count() {
        return this.repo.count();
    }
    countByStatus(status) {
        return this.repo.countBy({ accountStatus: status });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map