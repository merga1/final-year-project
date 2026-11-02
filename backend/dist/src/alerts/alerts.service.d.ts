import { Repository } from 'typeorm';
import { Alert, AlertType, AlertSeverity } from './alert.entity';
export declare class AlertsService {
    private readonly repo;
    constructor(repo: Repository<Alert>);
    findAll(): Promise<Alert[]>;
    findUnacknowledged(): Promise<Alert[]>;
    findByMeterId(meterId: string): Promise<Alert[]>;
    count(): Promise<number>;
    countUnacknowledged(): Promise<number>;
    countCriticalToday(): Promise<number>;
    acknowledge(id: string, adminName: string): Promise<Alert | null>;
    create(data: Partial<Alert>): Promise<Alert>;
    createIfNotRecent(meterId: string, deviceId: string, type: AlertType, message: string, severity: AlertSeverity): Promise<Alert | null>;
}
