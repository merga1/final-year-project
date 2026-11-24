import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../../config/env';
import { CustomersService } from '../../customers/customers.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly customers: CustomersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    const role = payload.role || 'customer';

    // Refresh customer meterId from the database so assigning a meter after
    // login unlocks home/usage/valve without forcing a re-login.
    if (role !== 'technician' && role !== 'admin' && payload.sub) {
      try {
        const customer = await this.customers.findOne(payload.sub);
        return {
          sub: customer.id,
          email: customer.email,
          name: customer.name,
          role: customer.role || 'customer',
          meterId: customer.meterId ?? null,
        };
      } catch {
        // Fall back to the token payload if the customer row is missing.
      }
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role,
      meterId: payload.meterId ?? null,
      technicianId: payload.technicianId,
    };
  }
}
