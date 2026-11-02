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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const customers_service_1 = require("../customers/customers.service");
const technicians_service_1 = require("../technicians/technicians.service");
let AuthService = class AuthService {
    constructor(customersService, techniciansService, jwtService) {
        this.customersService = customersService;
        this.techniciansService = techniciansService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const customer = await this.customersService.findByEmail(email);
        if (!customer)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return customer;
    }
    async loginCustomer(email, password) {
        const customer = await this.validateUser(email, password);
        const payload = {
            sub: customer.id,
            email: customer.email,
            name: customer.name,
            role: customer.role || 'customer',
            meterId: customer.meterId,
        };
        return { accessToken: this.jwtService.sign(payload), user: payload };
    }
    async loginAdmin(email, password) {
        const customer = await this.customersService.findByEmail(email);
        if (!customer) {
            const technician = await this.techniciansService.findByEmail(email);
            if (!(technician === null || technician === void 0 ? void 0 : technician.passwordHash) || technician.accountStatus !== 'active') {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const validTechnician = await bcrypt.compare(password, technician.passwordHash);
            if (!validTechnician)
                throw new common_1.UnauthorizedException('Invalid credentials');
            const payload = {
                sub: technician.id,
                technicianId: technician.id,
                email: technician.email,
                name: technician.name,
                role: 'technician',
                meterId: undefined,
            };
            return { accessToken: this.jwtService.sign(payload), user: payload };
        }
        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isAdmin = customer.role === 'admin' ||
            customer.email === 'admin2@gmail.com' ||
            customer.email === 'admin@admin.water';
        const role = isAdmin ? 'admin' : customer.role || 'customer';
        const payload = {
            sub: customer.id,
            email: customer.email,
            name: customer.name,
            role,
            meterId: customer.meterId,
        };
        return { accessToken: this.jwtService.sign(payload), user: payload };
    }
    async register(name, email, password, meterId) {
        if (email.toLowerCase().endsWith('@admin.water') ||
            email.toLowerCase() === 'admin2@gmail.com') {
            throw new common_1.BadRequestException('Cannot register with reserved administrator email address');
        }
        const existing = await this.customersService.findByEmail(email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(password, 10);
        const customer = await this.customersService.create({
            name,
            email,
            passwordHash,
            meterId,
            role: 'customer',
            accountStatus: 'active',
        });
        const payload = {
            sub: customer.id,
            email: customer.email,
            name: customer.name,
            role: 'customer',
            meterId: customer.meterId,
        };
        return { accessToken: this.jwtService.sign(payload), user: payload };
    }
    async changePassword(userId, oldPass, newPass) {
        if (!newPass || newPass.length < 6) {
            throw new common_1.BadRequestException('New password must be at least 6 characters long');
        }
        const customer = await this.customersService.findOne(userId).catch(() => null);
        const technician = customer ? null : await this.techniciansService.findOne(userId).catch(() => null);
        const user = customer !== null && customer !== void 0 ? customer : technician;
        if (!(user === null || user === void 0 ? void 0 : user.passwordHash))
            throw new common_1.UnauthorizedException('Account not found');
        const valid = await bcrypt.compare(oldPass, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Incorrect current password');
        const passwordHash = await bcrypt.hash(newPass, 10);
        if (customer) {
            await this.customersService.updatePasswordHash(userId, passwordHash);
        }
        else {
            await this.techniciansService.updatePassword(userId, passwordHash);
        }
        return { success: true, message: 'Password updated successfully' };
    }
    async forgotPassword(email) {
        var _a;
        const normalized = email.trim().toLowerCase();
        const known = (_a = await this.customersService.findByEmail(normalized)) !== null && _a !== void 0 ? _a : await this.techniciansService.findByEmail(normalized);
        return {
            success: true,
            message: known ? 'If the account exists, reset instructions will be sent shortly.' : 'If the account exists, reset instructions will be sent shortly.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customers_service_1.CustomersService,
        technicians_service_1.TechniciansService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map