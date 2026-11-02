export declare class AuditLog {
    id: string;
    actor: string;
    action: string;
    category: string;
    targetEntity: string;
    details: string;
    status: 'SUCCESS' | 'FAILED' | 'WARNING';
    ipAddress: string;
    createdAt: Date;
}
