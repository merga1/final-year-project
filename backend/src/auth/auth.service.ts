import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
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
    if (!customer) throw new UnauthorizedException('Invalid credentials');

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
    const user = await this.customersService.findOne(userId);
    const valid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Incorrect current password');

    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    await this.customersService.update(userId, { passwordHash });
    return { success: true, message: 'Password updated successfully' };
  }
}
