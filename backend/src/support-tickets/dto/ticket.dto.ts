import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const TICKET_STATUSES = ['pending', 'open', 'assigned', 'accepted', 'in_progress', 'resolved', 'closed', 'cancelled'];
export const TICKET_PRIORITIES = ['High', 'Medium', 'Low'];

const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase() : value);

export class CreateCustomerTicketDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() issue?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(TICKET_PRIORITIES) priority?: 'High' | 'Medium' | 'Low';
  @IsOptional() @IsString() customerAddress?: string;
  @IsOptional() @IsString() deviceId?: string;
}

export class AdminCreateTicketDto extends CreateCustomerTicketDto {
  @IsString() customerId: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() technicianId?: string;
  @IsOptional() @IsString() technicianName?: string;
  @IsOptional() @Transform(lower) @IsIn(TICKET_STATUSES) status?: string;
}

export class AdminUpdateTicketDto extends CreateCustomerTicketDto {
  /** `null` un-assigns the technician. */
  @IsOptional() @IsString() technicianId?: string | null;
  @IsOptional() @IsString() technicianName?: string;
  @IsOptional() @Transform(lower) @IsIn(TICKET_STATUSES) status?: string;
  @IsOptional() @IsString() reassignReason?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() progressNotes?: string;
  @IsOptional() @IsString() rejectionReason?: string;
}

export class TechnicianTransitionDto {
  @Transform(lower) @IsIn(['accepted', 'in_progress', 'rejected', 'resolved', 'closed']) status: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() progressNotes?: string;
  @IsOptional() @IsString() rejectionReason?: string;
}
