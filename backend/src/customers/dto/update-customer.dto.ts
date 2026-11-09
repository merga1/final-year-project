import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

/** Fields an admin may change. `role` and `passwordHash` are intentionally NOT editable here. */
export class UpdateCustomerDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() meterId?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsIn(['active', 'suspended', 'pending']) accountStatus?: 'active' | 'suspended' | 'pending';
}
