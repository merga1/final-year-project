import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsNotEmpty() @IsString() action: string;
  @IsOptional() @IsString() category?: string;
  @IsNotEmpty() @IsString() targetEntity: string;
  @IsNotEmpty() @IsString() details: string;
  @IsOptional() @IsIn(['SUCCESS', 'FAILED', 'WARNING']) status?: 'SUCCESS' | 'FAILED' | 'WARNING';
}
