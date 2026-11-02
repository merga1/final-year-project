import { Repository } from 'typeorm';
import { DeviceReading } from './device-reading.entity';
export declare class ReadingsService {
    private readonly repo;
    constructor(repo: Repository<DeviceReading>);
    create(data: Partial<DeviceReading>): Promise<DeviceReading>;
    findByMeterId(meterId?: string, limit?: number): Promise<DeviceReading[]>;
    getDailyUsage(meterId?: string): Promise<any[]>;
    getZoneUsage(): Promise<any>;
    getQualityTrend(): Promise<any>;
    findLatestByMeterId(meterId: string): Promise<DeviceReading | null>;
}
