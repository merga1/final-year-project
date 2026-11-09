import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';
import { ValveCommand } from './valve-command.entity';
import { ReadingsService } from '../readings/readings.service';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDeviceDto, ReadingDto } from './dto/device.dto';
import { THRESHOLDS } from './devices.constants';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly repo: Repository<Device>,
    @InjectRepository(ValveCommand) private readonly commandRepo: Repository<ValveCommand>,
    private readonly readings: ReadingsService,
    private readonly alerts: AlertsService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findRecent(limit: number) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findOne(id: string) {
    const device = await this.repo.findOneBy({ id });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  findByMeterId(meterId: string) {
    return this.repo.findOneBy({ meterId });
  }

  findByCustomerId(customerId: string) {
    return this.repo.findOneBy({ customerId });
  }

  /** Accepts either the meter number (ESP32-001) or the database id. */
  async resolve(idOrMeterId: string) {
    const device = (await this.findByMeterId(idOrMeterId)) ?? (await this.repo.findOneBy({ id: idOrMeterId }));
    if (!device) throw new NotFoundException(`Device ${idOrMeterId} not found`);
    return device;
  }

  async create(dto: CreateDeviceDto) {
    if (await this.findByMeterId(dto.meterId)) {
      throw new ConflictException(`Device with Meter ID '${dto.meterId}' already exists`);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async updateByMeterId(meterId: string, data: Partial<Device>) {
    await this.repo.update({ meterId }, data);
    return this.repo.findOneBy({ meterId });
  }

  /** Removes the customer link from a meter (e.g. when an admin moves it). */
  async unassignCustomer(meterId: string) {
    await this.repo
      .createQueryBuilder()
      .update(Device)
      .set({ customerId: null } as any)
      .where('meterId = :meterId', { meterId })
      .execute();
  }

  /**
   * Demo behaviour: the valve command is recorded and confirmed immediately.
   * With real hardware the command would stay `pending` until the meter acknowledges it.
   */
  async setValve(customerId: string, meterId: string, requested?: 'OPEN' | 'CLOSED') {
    const device = await this.findByMeterId(meterId);
    if (!device) throw new NotFoundException(`Device for meter ${meterId} not found`);
    if (device.connectivity === 'OFFLINE') {
      throw new BadRequestException('This device is offline. Reconnect it before changing the valve.');
    }
    const nextState = requested ?? (device.valveState === 'OPEN' ? 'CLOSED' : 'OPEN');
    const command = await this.commandRepo.save(
      this.commandRepo.create({
        customerId,
        meterId,
        requestedState: nextState,
        status: 'confirmed',
        confirmedAt: new Date(),
      }),
    );
    await this.updateByMeterId(meterId, { valveState: nextState });
    return { command, valveState: nextState };
  }

  /** Stores a meter reading, refreshes the device's live status and raises threshold alerts. */
  async ingestReading(dto: ReadingDto) {
    const device = await this.findByMeterId(dto.meterId);
    if (!device) throw new NotFoundException(`Unknown meter '${dto.meterId}'`);

    const deviceId = dto.deviceId || dto.meterId;
    const connectivity = dto.connectivity ?? 'ONLINE';

    const reading = await this.readings.create({
      deviceId,
      meterId: dto.meterId,
      flowRateLpm: dto.flowRateLpm,
      totalUsageLiters: dto.totalUsageLiters,
      turbidityNtu: dto.turbidityNtu,
      valveState: dto.valveState,
      connectivity,
      batteryPercent: dto.batteryPercent,
    });

    await this.updateByMeterId(dto.meterId, {
      connectivity,
      valveState: dto.valveState,
      batteryPercent: dto.batteryPercent,
      lastSeenAt: new Date(),
    });

    if (dto.turbidityNtu > THRESHOLDS.turbidityNtu) {
      const alert = await this.alerts.createIfNotRecent(
        dto.meterId, deviceId, 'WATER_QUALITY',
        `Turbidity ${dto.turbidityNtu} NTU exceeds ${THRESHOLDS.turbidityNtu} NTU threshold`, 'critical',
      );
      if (alert && device.customerId) {
        await this.notifications.create({
          userId: device.customerId,
          audience: 'customer',
          type: 'high_turbidity',
          title: 'Water quality warning',
          message: `Turbidity is ${dto.turbidityNtu} NTU. Please avoid using the water until it is safe.`,
          relatedId: device.id,
        });
      }
    }

    if (dto.flowRateLpm > THRESHOLDS.flowRateLpm) {
      const alert = await this.alerts.createIfNotRecent(
        dto.meterId, deviceId, 'HIGH_USAGE',
        `Flow rate ${dto.flowRateLpm} L/min is above normal`, 'warning',
      );
      if (alert && device.customerId) {
        await this.notifications.create({
          userId: device.customerId,
          audience: 'customer',
          type: 'high_flow',
          title: 'High water flow detected',
          message: `Flow rate is ${dto.flowRateLpm} L/min. Check for a possible leak.`,
          relatedId: device.id,
        });
      }
    }

    if (dto.batteryPercent < THRESHOLDS.batteryPercent) {
      await this.alerts.createIfNotRecent(
        dto.meterId, deviceId, 'LOW_BATTERY', `Battery at ${dto.batteryPercent}%`, 'warning',
      );
    }

    return reading;
  }

  count() {
    return this.repo.count();
  }

  countByConnectivity(connectivity: string) {
    return this.repo.countBy({ connectivity: connectivity as any });
  }
}
