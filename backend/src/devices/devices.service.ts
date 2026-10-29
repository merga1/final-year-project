import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';
import { ValveCommand } from './valve-command.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly repo: Repository<Device>,
    @InjectRepository(ValveCommand)
    private readonly commandRepo: Repository<ValveCommand>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const device = await this.repo.findOneBy({ id });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  async findByMeterId(meterId: string) {
    return this.repo.findOneBy({ meterId });
  }

  async create(data: Partial<Device>) {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async updateByMeterId(meterId: string, data: Partial<Device>) {
    await this.repo.update({ meterId }, data);
    return this.repo.findOneBy({ meterId });
  }

  createValveCommand(data: Partial<ValveCommand>) {
    return this.commandRepo.save(this.commandRepo.create(data));
  }

  count() {
    return this.repo.count();
  }

  countByConnectivity(connectivity: string) {
    return this.repo.countBy({ connectivity: connectivity as any });
  }
}
