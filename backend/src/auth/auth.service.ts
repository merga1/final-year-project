import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from '../customers/customers.service';
import { TechniciansService } from '../technicians/technicians.service';
import { DevicesService } from '../devices/devices.service';

const INVALID = 'Invalid credentials';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly techniciansService: TechniciansService,
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
  ) {}

  private sign(payload: Record<string, unknown>) {
    return { accessToken: this.jwtService.sign(payload), user: payload };
  }

  /** Customers/admins are looked up first, technicians second. The role comes only from the database. */
  async login(email: string, password: string) {
    const customer = await this.customersService.findByEmail(email);
    if (customer) {
      if (!(await bcrypt.compare(password, customer.passwordHash))) throw new UnauthorizedException(INVALID);
      if (customer.accountStatus === 'suspended') throw new UnauthorizedException('This account is suspended');
      return this.sign({
        sub: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role || 'customer',
        meterId: customer.meterId,
      });
    }

    const technician = await this.techniciansService.findByEmail(email);
    if (!technician?.passwordHash || technician.accountStatus !== 'active') {
      throw new UnauthorizedException(INVALID);
    }
    if (!(await bcrypt.compare(password, technician.passwordHash))) throw new UnauthorizedException(INVALID);
    return this.sign({
      sub: technician.id,
      technicianId: technician.id,
      email: technician.email,
      name: technician.name,
      role: 'technician',
    });
  }

  async register(name: string, email: string, password: string, meterId?: string, address?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (
      (await this.customersService.findByEmail(normalizedEmail)) ||
      (await this.techniciansService.findByEmail(normalizedEmail))
    ) {
      throw new ConflictException('Email already registered');
    }

    const normalizedMeterId = meterId?.trim() || undefined;
    if (normalizedMeterId) {
      const device = await this.devicesService.findByMeterId(normalizedMeterId);
      if (!device) {
        throw new BadRequestException('Water meter number not found. Check the number or request a new meter.');
      }
      const linked = await this.customersService.findByMeterId(normalizedMeterId);
      if (device.customerId || linked) {
        throw new ConflictException('This water meter is already linked to an account');
      }
    }

    const customer = await this.customersService.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      meterId: normalizedMeterId,
      address,
      role: 'customer',
      accountStatus: 'active',
    });

    if (normalizedMeterId) {
      await this.devicesService.updateByMeterId(normalizedMeterId, { customerId: customer.id });
    }

    return this.sign({
      sub: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
      meterId: customer.meterId,
    });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const customer = await this.customersService.findOne(userId).catch(() => null);
    const technician = customer ? null : await this.techniciansService.findOne(userId).catch(() => null);
    const user = customer ?? technician;
    if (!user?.passwordHash) throw new UnauthorizedException('Account not found');
    if (!(await bcrypt.compare(oldPass, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect current password');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    if (customer) await this.customersService.updatePasswordHash(userId, passwordHash);
    else await this.techniciansService.updatePassword(userId, passwordHash);
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Always returns the same response so account existence is not revealed.
   * A production system would email/SMS a reset token here (not implemented).
   */
  async forgotPassword(_email: string) {
    return { success: true, message: 'If the account exists, reset instructions will be sent shortly.' };
  }
}
