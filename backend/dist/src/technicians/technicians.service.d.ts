import { Repository } from 'typeorm';
import { Technician } from './technician.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';
export declare class TechniciansService {
    private readonly repo;
    constructor(repo: Repository<Technician>);
    findAll(): Promise<Technician[]>;
    findByEmail(email: string): Promise<Technician | null>;
    findOne(id: string): Promise<Technician>;
    create(dto: CreateTechnicianDto): Promise<Technician>;
    update(id: string, data: Partial<Technician>): Promise<Technician>;
    findTop(limit?: number): Promise<Technician[]>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
    findLeastBusy(): Promise<Technician | null>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
}
