import { ReadingsService } from './readings.service';
export declare class ReadingsController {
    private readonly service;
    constructor(service: ReadingsService);
    findAll(meterId?: string): Promise<import("./device-reading.entity").DeviceReading[]>;
    getDailyUsage(meterId?: string): Promise<any[]>;
    getZoneUsage(): Promise<any>;
    getQualityTrend(): Promise<any>;
    getMobileReadings(user: any): Promise<import("./device-reading.entity").DeviceReading[]>;
    getMobileDailyUsage(user: any): Promise<any[]>;
}
