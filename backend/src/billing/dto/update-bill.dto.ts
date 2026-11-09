import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBillDto {
  @IsOptional() @IsIn(['pending', 'paid', 'overdue', 'cancelled']) status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  @IsOptional() @IsNumber() @Min(0) amountEtb?: number;
  @IsOptional() @IsNumber() @Min(0) usageLiters?: number;
  @IsOptional() @IsNumber() @Min(0) rate?: number;
  @IsOptional() @IsString() dueDate?: string;
}
