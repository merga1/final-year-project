import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  findAll(limit = 100): Promise<AuditLog[]> {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  create(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.auditRepo.save(this.auditRepo.create(data));
  }
}
