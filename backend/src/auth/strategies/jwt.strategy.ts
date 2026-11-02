import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const rawSecret = process.env.JWT_SECRET || 'smart_water_jwt_secret_2026_final_year';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: rawSecret.replace(/^\uFEFF/, '').trim(),
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      meterId: payload.meterId,
      technicianId: payload.technicianId,
    };
  }
}
