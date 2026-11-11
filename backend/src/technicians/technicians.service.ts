import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician } from './technician.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
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
    const email = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('A technician with this email address already exists');
    }

    const tech = this.repo.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      name: `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim() || 'Technician',
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      phone: dto.phone,
      hireDate: dto.hireDate,
      address: dto.address,
      specialization: dto.specialization || 'No specialization',
      qualifications: dto.qualifications,
      zone: dto.zone || 'Zone A',
      status: 'on_duty',
      accountStatus: 'active',
      currentJobCount: 0,
      completedRepairs: 0,
      mustChangePassword: true,
    });
    return this.repo.save(tech);
  }

  /** Admin edits from the dashboard (validated fields only; password is re-hashed). */
  async updateFromAdmin(id: string, dto: UpdateTechnicianDto) {
    const { password, ...rest } = dto;
    const data: Partial<Technician> = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
      // When an admin resets the password the technician must change it on next login.
      data.mustChangePassword = true;
    }
    return this.update(id, data);
  }

  /** Internal update (also used by the ticket workflow for job counters). */
  async update(id: string, data: Partial<Technician>) {
    const existing = await this.findOne(id);
    if (data.firstName || data.lastName) {
      const first = data.firstName ?? existing.firstName ?? '';
      const last = data.lastName ?? existing.lastName ?? '';
      data.name = `${first} ${last}`.trim() || existing.name;
    }
    if (Object.keys(data).length) await this.repo.update(id, data);
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

  async updatePassword(id: string, passwordHash: string) {
    await this.findOne(id);
    await this.repo.update(id, { passwordHash, mustChangePassword: false });
  }
}
