import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TechniciansService } from '../technicians/technicians.service';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
    private readonly notifications: NotificationsService,
    private readonly technicians: TechniciansService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  findByTechnician(technicianId: string, status?: string) {
    return this.repo.find({
      where: { technicianId, ...(status ? { status: status as any } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForTechnician(id: string, technicianId: string) {
    const ticket = await this.repo.findOneBy({ id, technicianId });
    if (!ticket) throw new NotFoundException('Ticket not found or not assigned to you');
    return ticket;
  }

  create(data: Partial<SupportTicket>) {
    const ticket = this.repo.create(data);
    return this.repo.save(ticket);
  }

  async createCustomerTicket(data: Partial<SupportTicket>) {
    const technician = await this.technicians.findLeastBusy();
    const now = new Date();
    const ticket = this.repo.create({
      ...data,
      status: technician ? 'assigned' : 'pending',
      technicianId: technician?.id,
      technicianName: technician?.name,
      assignedAt: technician ? now : undefined,
      statusHistory: JSON.stringify([{ status: technician ? 'assigned' : 'pending', at: now.toISOString() }]),
    });
    const saved = await this.repo.save(ticket);

    if (technician) {
      await this.technicians.update(technician.id, { currentJobCount: technician.currentJobCount + 1 });
      await this.notifications.create({
        userId: technician.id,
        audience: 'technician',
        type: 'ticket_assignment',
        title: 'New ticket assigned',
        message: `${saved.type}: ${saved.description ?? saved.issue}`,
        relatedId: saved.id,
      });
      await this.notifications.create({
        userId: saved.customerId,
        audience: 'customer',
        type: 'ticket_assignment',
        title: 'Technician assigned',
        message: `${technician.name} is assigned to your support ticket.`,
        relatedId: saved.id,
      });
    }
    return saved;
  }

  async update(id: string, data: Partial<SupportTicket>) {
    const before = await this.repo.findOneBy({ id });
    if (!before) throw new NotFoundException('Ticket not found');
    await this.repo.update(id, data);
    const after = await this.repo.findOneBy({ id });
    if (after && (data.technicianId || data.status) && after.customerId) {
      await this.notifications.create({
        userId: after.customerId,
        audience: 'customer',
        type: data.technicianId ? 'ticket_assignment' : 'ticket_status',
        title: data.technicianId ? 'Ticket updated' : 'Ticket status updated',
        message: data.technicianId
          ? `${after.technicianName ?? 'A technician'} is assigned to your ticket.`
          : `Your ticket is now ${after.status}.`,
        relatedId: after.id,
      });
    }
    if (after?.technicianId && data.technicianId) {
      await this.notifications.create({
        userId: after.technicianId,
        audience: 'technician',
        type: 'ticket_assignment',
        title: 'Ticket assigned',
        message: `${after.type}: ${after.description ?? after.issue}`,
        relatedId: after.id,
      });
    }
    return after;
  }

  async transitionForTechnician(
    id: string,
    technicianId: string,
    data: { status: string; notes?: string; progressNotes?: string; rejectionReason?: string },
  ) {
    const ticket = await this.findOneForTechnician(id, technicianId);
    const requested = data.status.toLowerCase();
    const now = new Date();
    const current = ticket.status.toLowerCase();

    if (requested === 'accepted' && !['assigned', 'open', 'pending'].includes(current)) {
      throw new BadRequestException('Only an assigned ticket can be accepted');
    }
    if (requested === 'rejected') {
      if (!data.rejectionReason?.trim()) throw new BadRequestException('A rejection reason is required');
      ticket.status = 'pending';
      ticket.rejectionReason = data.rejectionReason.trim();
      ticket.technicianId = null;
      ticket.technicianName = null;
      ticket.assignedAt = null;
      await this.decrementWorkload(technicianId, false);
    } else if (requested === 'resolved') {
      if (!['accepted', 'in_progress'].includes(current)) throw new BadRequestException('Accept the ticket before resolving it');
      if (!data.notes?.trim()) throw new BadRequestException('Resolution notes are required');
      ticket.status = 'resolved';
      ticket.notes = data.notes.trim();
      ticket.progressNotes = data.progressNotes?.trim() || ticket.progressNotes;
      ticket.resolvedAt = now;
      await this.decrementWorkload(technicianId, true);
    } else if (requested === 'closed') {
      if (current !== 'resolved') throw new BadRequestException('Only resolved tickets can be closed');
      ticket.status = 'closed';
    } else if (requested === 'accepted' || requested === 'in_progress') {
      ticket.status = requested === 'accepted' ? 'accepted' : 'in_progress';
      ticket.acceptedAt = ticket.acceptedAt ?? now;
      if (data.progressNotes?.trim()) ticket.progressNotes = data.progressNotes.trim();
    } else {
      throw new BadRequestException('Unsupported ticket status transition');
    }

    const history = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
    history.push({ status: ticket.status, at: now.toISOString(), by: technicianId });
    ticket.statusHistory = JSON.stringify(history);
    const saved = await this.repo.save(ticket);
    await this.notifications.create({
      userId: saved.customerId,
      audience: 'customer',
      type: 'ticket_status',
      title: 'Support ticket updated',
      message: `Your ticket is now ${saved.status}.`,
      relatedId: saved.id,
    });
    return saved;
  }

  private async decrementWorkload(technicianId: string, completed: boolean) {
    const technician = await this.technicians.findOne(technicianId);
    await this.technicians.update(technicianId, {
      currentJobCount: Math.max(0, (technician.currentJobCount ?? 0) - 1),
      completedRepairs: technician.completedRepairs + (completed ? 1 : 0),
    });
  }

  count() {
    return this.repo.count();
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }
}
