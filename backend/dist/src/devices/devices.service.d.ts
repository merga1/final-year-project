import { Repository } from 'typeorm';
import { Device } from './device.entity';
import { ValveCommand } from './valve-command.entity';
export declare class DevicesService {
    private readonly repo;
    private readonly commandRepo;
    constructor(repo: Repository<Device>, commandRepo: Repository<ValveCommand>);
    findAll(): Promise<Device[]>;
    findOne(id: string): Promise<Device>;
    findByMeterId(meterId: string): Promise<Device | null>;
    create(data: Partial<Device>): Promise<Device>;
    updateByMeterId(meterId: string, data: Partial<Device>): Promise<Device | null>;
    createValveCommand(data: Partial<ValveCommand>): Promise<ValveCommand>;
    count(): Promise<number>;
    countByConnectivity(connectivity: string): Promise<number>;
}
