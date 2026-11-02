import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
export declare class AuditService implements OnModuleInit {
    private auditRepo;
    constructor(auditRepo: Repository<AuditLog>);
    onModuleInit(): Promise<void>;
    findAll(limit?: number): Promise<AuditLog[]>;
    create(data: Partial<AuditLog>): Promise<AuditLog>;
}
