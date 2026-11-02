export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'WATER_QUALITY' | 'HIGH_USAGE' | 'DEVICE_OFFLINE' | 'VALVE_FAULT' | 'LOW_BATTERY';
export declare class Alert {
    id: string;
    deviceId: string;
    meterId: string;
    type: AlertType;
    message: string;
    severity: AlertSeverity;
    acknowledged: boolean;
    acknowledgedBy: string;
    createdAt: Date;
}
