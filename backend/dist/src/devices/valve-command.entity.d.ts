export declare class ValveCommand {
    id: string;
    customerId: string;
    meterId: string;
    requestedState: 'OPEN' | 'CLOSED';
    status: 'pending' | 'confirmed' | 'timeout' | 'failed';
    confirmedAt: Date;
    createdAt: Date;
}
