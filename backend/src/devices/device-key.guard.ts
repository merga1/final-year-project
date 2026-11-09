import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { getDeviceApiKey, isProduction } from '../config/env';

/**
 * Protects the IoT ingestion endpoint with a shared key sent as `x-device-key`.
 * If DEVICE_API_KEY is not configured the guard is open in development and
 * closed in production, so a forgotten variable can never expose the endpoint.
 */
@Injectable()
export class DeviceKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = getDeviceApiKey();
    if (!expected) {
      if (isProduction()) throw new UnauthorizedException('Device authentication is not configured');
      return true;
    }
    const provided = context.switchToHttp().getRequest().headers['x-device-key'];
    if (provided !== expected) throw new UnauthorizedException('Invalid device key');
    return true;
  }
}
