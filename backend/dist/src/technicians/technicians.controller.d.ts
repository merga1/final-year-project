import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
export declare class TechniciansController {
    private readonly service;
    constructor(service: TechniciansService);
    findAll(): Promise<import("./technician.entity").Technician[]>;
    findOne(id: string): Promise<import("./technician.entity").Technician>;
    create(body: CreateTechnicianDto): Promise<import("./technician.entity").Technician>;
    update(id: string, body: Partial<CreateTechnicianDto>): Promise<import("./technician.entity").Technician>;
}
