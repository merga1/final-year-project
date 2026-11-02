export type Connectivity = 'ONLINE' | 'OFFLINE' | 'WARNING';
export type ValveState = 'OPEN' | 'CLOSED';
export declare class Device {
    id: string;
    meterId: string;
    customerId: string;
    zone: string;
    connectivity: Connectivity;
    valveState: ValveState;
    batteryPercent: number;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
