import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
      role: 'customer',
      meterId: customer.meterId,
    };
    return { accessToken: this.jwtService.sign(payload), user: payload };
  }

  async loginAdmin(email: string, password: string) {
    // Admin accounts are seeded with a special flag in the name field (demo approach)
    // In production you'd have a separate admins table.
    const customer = await this.customersService.findByEmail(email);
    if (!customer) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Only accounts with email ending in @admin.water are admins (demo convention)
    const role = customer.email.endsWith('@admin.water') ? 'admin' : 'customer';

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
    const existing = await this.customersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await this.customersService.create({ name, email, passwordHash, meterId });

    const payload = {
      sub: customer.id, email: customer.email,
      name: customer.name, role: 'customer', meterId: customer.meterId,
    };
    return { accessToken: this.jwtService.sign(payload), user: payload };
  }
}
