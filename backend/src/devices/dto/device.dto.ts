import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty() @IsString() meterId: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsIn(['ONLINE', 'OFFLINE', 'WARNING']) connectivity?: 'ONLINE' | 'OFFLINE' | 'WARNING';
  @IsOptional() @IsIn(['OPEN', 'CLOSED']) valveState?: 'OPEN' | 'CLOSED';
  @IsOptional() @IsNumber() @Min(0) @Max(100) batteryPercent?: number;
}

export class ValveCommandDto {
  @IsOptional() @IsIn(['OPEN', 'CLOSED']) valveState?: 'OPEN' | 'CLOSED';
}

/** Payload an ESP32 meter posts to /api/devices/reading. */
export class ReadingDto {
  @IsNotEmpty() @IsString() meterId: string;
  @IsOptional() @IsString() deviceId?: string;
  @IsNumber() @Min(0) flowRateLpm: number;
  @IsNumber() @Min(0) totalUsageLiters: number;
  @IsNumber() @Min(0) turbidityNtu: number;
  @IsIn(['OPEN', 'CLOSED']) valveState: 'OPEN' | 'CLOSED';
  @IsOptional() @IsIn(['ONLINE', 'OFFLINE', 'WARNING']) connectivity?: 'ONLINE' | 'OFFLINE' | 'WARNING';
  @IsNumber() @Min(0) @Max(100) batteryPercent: number;
}
