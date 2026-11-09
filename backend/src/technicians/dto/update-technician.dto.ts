import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTechnicianDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() hireDate?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() qualifications?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsIn(['on_duty', 'off_duty', 'on_leave']) status?: 'on_duty' | 'off_duty' | 'on_leave';
  @IsOptional() @IsIn(['active', 'suspended', 'pending']) accountStatus?: 'active' | 'suspended' | 'pending';
}
