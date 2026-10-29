import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from '../customers/customers.service';
import { TechniciansService } from '../technicians/technicians.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly techniciansService: TechniciansService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const customer = await this.customersService.findByEmail(email);
    if (!customer) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return customer;
  }

  async loginCustomer(email: string, password: string) {
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

  async loginAdmin(email: string, password: string) {
    const customer = await this.customersService.findByEmail(email);
    if (!customer) {
      const technician = await this.techniciansService.findByEmail(email);
      if (!technician?.passwordHash || technician.accountStatus !== 'active') {
        throw new UnauthorizedException('Invalid credentials');
      }
      const validTechnician = await bcrypt.compare(password, technician.passwordHash);
      if (!validTechnician) throw new UnauthorizedException('Invalid credentials');
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
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Admin authorization check: explicit admin role or designated admin emails
    const isAdmin =
      customer.role === 'admin' ||
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

  async register(name: string, email: string, password: string, meterId?: string) {
    // Prevent registering with reserved administrator emails or domains
    if (
      email.toLowerCase().endsWith('@admin.water') ||
      email.toLowerCase() === 'admin2@gmail.com'
    ) {
      throw new BadRequestException('Cannot register with reserved administrator email address');
    }

    const existing = await this.customersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

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

  async changePassword(userId: string, oldPass: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const customer = await this.customersService.findOne(userId).catch(() => null);
    const technician = customer ? null : await this.techniciansService.findOne(userId).catch(() => null);
    const user = customer ?? technician;
    if (!user?.passwordHash) throw new UnauthorizedException('Account not found');
    const valid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Incorrect current password');

    const passwordHash = await bcrypt.hash(newPass, 10);
    if (customer) {
      await this.customersService.updatePasswordHash(userId, passwordHash);
    } else {
      await this.techniciansService.updatePassword(userId, passwordHash);
    }
    return { success: true, message: 'Password updated successfully' };
  }

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const known = await this.customersService.findByEmail(normalized) ?? await this.techniciansService.findByEmail(normalized);
    // Do not reveal whether an account exists. A production deployment should
    // enqueue an email/SMS reset token here.
    return {
      success: true,
      message: known ? 'If the account exists, reset instructions will be sent shortly.' : 'If the account exists, reset instructions will be sent shortly.',
    };
  }
}
