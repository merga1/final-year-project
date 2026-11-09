import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional() @IsString() billId?: string;
  /** Ignored when `billId` is given: the bill's own amount is used. */
  @IsOptional() @IsNumber() @IsPositive() amount?: number;
  @IsOptional() @IsIn(['chapa', 'bank_transfer', 'mobile_payment', 'cash']) method?: 'chapa' | 'bank_transfer' | 'mobile_payment' | 'cash';
  @IsOptional() @IsString() reference?: string;
}

export class CreateChapaPaymentDto {
  @IsOptional() @IsString() billId?: string;
  @IsOptional() @IsNumber() @IsPositive() amount?: number;
  @IsOptional() @IsString() reference?: string;
}
