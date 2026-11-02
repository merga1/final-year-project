import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private readonly service;
    constructor(service: AlertsService);
    findAll(): Promise<import("./alert.entity").Alert[]>;
    acknowledge(id: string, user: any): Promise<import("./alert.entity").Alert | null>;
}
