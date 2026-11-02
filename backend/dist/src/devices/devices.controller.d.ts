import { DevicesService } from './devices.service';
import { ReadingsService } from '../readings/readings.service';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class DevicesController {
    private readonly devicesService;
    private readonly readingsService;
    private readonly alertsService;
    private readonly notifications;
    constructor(devicesService: DevicesService, readingsService: ReadingsService, alertsService: AlertsService, notifications: NotificationsService);
    toggleValve(user: any, body: {
        valveState?: 'OPEN' | 'CLOSED';
    }): Promise<{
        success: boolean;
        commandId: string;
        pending: boolean;
        meterId: any;
        valveState: "OPEN" | "CLOSED";
        message: string;
    }>;
    findAll(): Promise<import("./device.entity").Device[]>;
    create(body: any): Promise<import("./device.entity").Device>;
    findOne(id: string): Promise<import("./device.entity").Device>;
    activate(id: string): Promise<{
        success: boolean;
        message: string;
        connectivity: string;
    }>;
    deactivate(id: string): Promise<{
        success: boolean;
        message: string;
        connectivity: string;
    }>;
    ingestReading(body: any): Promise<import("../readings/device-reading.entity").DeviceReading>;
}
