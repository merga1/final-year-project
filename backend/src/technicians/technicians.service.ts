import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician } from './technician.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(Technician)
    private readonly repo: Repository<Technician>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  async findOne(id: string) {
    const tech = await this.repo.findOneBy({ id });
    if (!tech) throw new NotFoundException(`Technician ${id} not found`);
    return tech;
  }

  async create(dto: CreateTechnicianDto) {
    const name = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();
    const tech = this.repo.create({
      ...dto,
      name: name || 'Technician',
      email: dto.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password || 'technician123', 10),
      specialization: dto.specialization || 'No specialization',
      status: 'on_duty',
      accountStatus: 'active',
      currentJobCount: 0,
      completedRepairs: 0,
    });
    return this.repo.save(tech);
  }

  async update(id: string, data: Partial<Technician>) {
    await this.findOne(id);
    if (data.firstName || data.lastName) {
      const existing = await this.findOne(id);
      const first = data.firstName ?? existing.firstName ?? '';
      const last = data.lastName ?? existing.lastName ?? '';
      data.name = `${first} ${last}`.trim();
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  findTop(limit = 5) {
    return this.repo.find({
      order: { completedRepairs: 'DESC' },
      take: limit,
    });
  }

  count() {
    return this.repo.count();
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }

  findLeastBusy() {
    return this.repo.findOne({
      where: { status: 'on_duty', accountStatus: 'active' },
      order: { currentJobCount: 'ASC', createdAt: 'ASC' },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.findOne(id);
    await this.repo.update(id, { passwordHash });
  }
}
