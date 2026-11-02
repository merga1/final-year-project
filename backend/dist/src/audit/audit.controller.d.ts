import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(limit?: string): Promise<import("./audit-log.entity").AuditLog[]>;
    createAuditLog(user: any, body: {
        action: string;
        category?: string;
        targetEntity: string;
        details: string;
        status?: 'SUCCESS' | 'FAILED' | 'WARNING';
    }): Promise<import("./audit-log.entity").AuditLog>;
}
