import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from '../customers/customers.service';
import { TechniciansService } from '../technicians/technicians.service';
import { DevicesService } from '../devices/devices.service';
import { SupportTicketsService } from '../support-tickets/support-tickets.service';
import { RegisterMeterRequestDto } from './dto/auth.dto';

const INVALID = 'Invalid credentials';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly techniciansService: TechniciansService,
    private readonly devicesService: DevicesService,
    private readonly supportTickets: SupportTicketsService,
    private readonly jwtService: JwtService,
  ) {}

  private sign(payload: Record<string, unknown>) {
    return { accessToken: this.jwtService.sign(payload), user: payload };
  }

  /** Customers/admins are looked up first, technicians second. The role comes only from the database. */
  async login(email: string, password: string, requestedRole?: 'customer' | 'technician') {
    const customer = await this.customersService.findByEmail(email);

    // When the technician portal is selected, resolve the technician account
    // first. Some people exist in both tables, and the portal choice must win.
    if (requestedRole !== 'technician' && customer) {
      if (!(await bcrypt.compare(password, customer.passwordHash))) throw new UnauthorizedException(INVALID);
      if (customer.accountStatus === 'suspended') throw new UnauthorizedException('This account is suspended');

      const role = customer.role || 'customer';

      // A customer without a meter is still waiting for an admin to approve
      // their water meter request. They should not reach the dashboard yet.
      if (role === 'customer' && !customer.meterId) {
        throw new UnauthorizedException(
          'Your water meter request is awaiting admin approval. Please log in again once a meter has been assigned to your account.',
        );
      }

      return this.sign({
        sub: customer.id,
        email: customer.email,
        name: customer.name,
        role,
        meterId: customer.meterId,
      });
    }

    const technician = await this.techniciansService.findByEmail(email);
    if (technician) {
      if (!technician.passwordHash) {
        throw new UnauthorizedException(
          'This technician account has no password yet. Ask an administrator to set one.',
        );
      }
      if (technician.accountStatus !== 'active') {
        throw new UnauthorizedException(
          'This technician account is not active. Contact an administrator.',
        );
      }
      if (!(await bcrypt.compare(password, technician.passwordHash))) {
        throw new UnauthorizedException(INVALID);
      }

      if (requestedRole && requestedRole !== 'technician') {
        throw new UnauthorizedException(
          'This is a technician account. Choose Technician on the previous screen.',
        );
      }

      return this.sign({
        sub: technician.id,
        technicianId: technician.id,
        email: technician.email,
        name: technician.name,
        role: 'technician',
        mustChangePassword: technician.mustChangePassword ?? false,
      });
    }

    if (requestedRole === 'technician' && customer) {
      throw new UnauthorizedException(
        'No technician account is registered with this email. Choose Customer on the previous screen.',
      );
    }

    throw new UnauthorizedException(INVALID);
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
      // Customers waiting for a meter are activated when an admin links one.
      accountStatus: normalizedMeterId ? 'active' : 'pending',
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

  /**
   * Creates a pending customer account and sends the water-meter request to
   * the admin queue in one step. No session is issued: the customer logs in
   * only after an admin links a meter to the account.
   */
  async registerMeterRequest(dto: RegisterMeterRequestDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    if (
      (await this.customersService.findByEmail(normalizedEmail)) ||
      (await this.techniciansService.findByEmail(normalizedEmail))
    ) {
      throw new ConflictException('Email already registered');
    }

    const customer = await this.customersService.create({
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(dto.password, 10),
      address: dto.address.trim(),
      role: 'customer',
      accountStatus: 'pending',
    });

    try {
      await this.supportTickets.createCustomerTicket({
        customerId: customer.id,
        customerName: customer.name,
        type: 'Water Meter Request',
        issue: 'Request a new water meter',
        priority: 'Medium',
        description: [
          `Installation address: ${dto.address.trim()}`,
          `Contact phone: ${dto.phone.trim()}`,
          dto.details?.trim() ? `Additional details: ${dto.details.trim()}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        customerAddress: dto.address.trim(),
        subject: 'Request a new water meter',
      });
    } catch (error) {
      // Do not leave an orphan pending account if the request could not be
      // queued. The customer can safely register again.
      await this.customersService.remove(customer.id).catch(() => undefined);
      throw error;
    }

    return {
      success: true,
      message:
        'Your account was created. An administrator will review your meter request; you can log in after a meter is assigned.',
      customerId: customer.id,
    };
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
