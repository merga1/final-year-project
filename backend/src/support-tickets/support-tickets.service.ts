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

  async findOne(id: string) {
    const ticket = await this.repo.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
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

  async createAdminTicket(data: any) {
    let technicianName = data.technicianName;
    if (data.technicianId && !technicianName) {
      const tech = await this.technicians.findOne(data.technicianId).catch(() => null);
      if (tech) technicianName = tech.name;
    }
    const status = data.technicianId ? 'assigned' : (data.status || 'pending');
    const now = new Date();
    const ticket = this.repo.create({
      ...data,
      status,
      technicianName: technicianName || null,
      assignedAt: data.technicianId ? now : null,
      statusHistory: JSON.stringify([{ status, at: now.toISOString(), note: 'Created by Admin from Alert dispatch' }]),
    } as Partial<SupportTicket>);
    const saved: SupportTicket = await this.repo.save(ticket);
    if (data.technicianId) {
      await this.technicians.update(data.technicianId, { currentJobCount: () => 'currentJobCount + 1' } as any).catch(() => {});
      await this.notifications.create({
        userId: data.technicianId,
        audience: 'technician',
        type: 'ticket_assignment',
        title: 'New ticket assigned from Alert',
        message: `${saved.type}: ${saved.description ?? saved.issue}`,
        relatedId: saved.id,
      }).catch(() => {});
    }
    return saved;
  }

  async createCustomerTicket(data: Partial<SupportTicket>) {
    const technician = await this.technicians.findLeastBusy().catch(() => null);
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
      await this.technicians.update(technician.id, { currentJobCount: (technician.currentJobCount || 0) + 1 }).catch(() => {});
      await this.notifications.create({
        userId: technician.id,
        audience: 'technician',
        type: 'ticket_assignment',
        title: 'New ticket assigned',
        message: `${saved.type}: ${saved.description ?? saved.issue}`,
        relatedId: saved.id,
      }).catch(() => {});
      if (saved.customerId) {
        await this.notifications.create({
          userId: saved.customerId,
          audience: 'customer',
          type: 'ticket_assignment',
          title: 'Technician assigned',
          message: `${technician.name} is assigned to your support ticket.`,
          relatedId: saved.id,
        }).catch(() => {});
      }
    }
    return saved;
  }

  async update(id: string, data: any) {
    const before = await this.repo.findOneBy({ id });
    if (!before) throw new NotFoundException('Ticket not found');

    const updatePayload: Partial<SupportTicket> = {};

    // 1. Reassignment reason / notes handling
    const reasonText = data.reassignReason || data.reason || data.notes;
    if (reasonText) {
      updatePayload.notes = reasonText;
      let historyArr: any[] = [];
      try {
        if (before.statusHistory) {
          historyArr = JSON.parse(before.statusHistory);
          if (!Array.isArray(historyArr)) historyArr = [{ entry: before.statusHistory }];
        }
      } catch {
        historyArr = [{ entry: before.statusHistory }];
      }
      historyArr.push({
        status: data.status || before.status,
        note: reasonText,
        at: new Date().toISOString(),
      });
      updatePayload.statusHistory = JSON.stringify(historyArr);
    }

    // 2. Technician handling and workload synchronization
    if (data.technicianId !== undefined) {
      updatePayload.technicianId = data.technicianId;
      if (data.technicianId) {
        try {
          const newTech = await this.technicians.findOne(data.technicianId).catch(() => null);
          if (newTech) {
            updatePayload.technicianName = newTech.name;
            updatePayload.assignedAt = new Date();
            // Increment workload if reassigned or newly assigned to this technician
            if (before.technicianId !== data.technicianId) {
              await this.technicians.update(newTech.id, {
                currentJobCount: (newTech.currentJobCount || 0) + 1,
              }).catch(() => null);
            }
          }
        } catch (techErr) {
          console.warn('Could not load technician details:', techErr);
        }

        // Decrement workload for previous technician if reassigned
        if (before.technicianId && before.technicianId !== data.technicianId) {
          try {
            const oldTech = await this.technicians.findOne(before.technicianId).catch(() => null);
            if (oldTech && (oldTech.currentJobCount || 0) > 0) {
              await this.technicians.update(oldTech.id, {
                currentJobCount: Math.max(0, oldTech.currentJobCount - 1),
              }).catch(() => null);
            }
          } catch {
            // non-fatal
          }
        }
      } else {
        updatePayload.technicianName = null;
        updatePayload.assignedAt = null;
      }
    } else if (data.technicianName !== undefined) {
      updatePayload.technicianName = data.technicianName;
    }

    // 3. Status handling
    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === 'resolved' && !before.resolvedAt) {
        updatePayload.resolvedAt = new Date();
      }
      if (data.status === 'accepted' && !before.acceptedAt) {
        updatePayload.acceptedAt = new Date();
      }
    }

    // 4. Whitelisted SupportTicket entity fields only
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.issue !== undefined) updatePayload.issue = data.issue;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.progressNotes !== undefined) updatePayload.progressNotes = data.progressNotes;
    if (data.rejectionReason !== undefined) updatePayload.rejectionReason = data.rejectionReason;
    if (data.customerAddress !== undefined) updatePayload.customerAddress = data.customerAddress;
    if (data.deviceId !== undefined) updatePayload.deviceId = data.deviceId;

    // Execute update with strictly valid entity columns
    await this.repo.update(id, updatePayload);
    const after = await this.repo.findOneBy({ id });

    // 5. Notifications dispatch with safe try/catch
    if (after && (data.technicianId || data.status) && after.customerId) {
      try {
        await this.notifications.create({
          userId: after.customerId,
          audience: 'customer',
          type: data.technicianId ? 'ticket_assignment' : 'ticket_status',
          title: data.technicianId ? 'Ticket updated' : 'Ticket status updated',
          message: data.technicianId
            ? `${after.technicianName ?? 'A technician'} is assigned to your ticket.`
            : `Your ticket is now ${after.status}.`,
          relatedId: after.id,
        }).catch(() => {});
      } catch {
        // non-fatal
      }
    }

    if (after?.technicianId && data.technicianId) {
      try {
        await this.notifications.create({
          userId: after.technicianId,
          audience: 'technician',
          type: 'ticket_assignment',
          title: 'Ticket assigned',
          message: `${after.type}: ${after.description ?? after.issue}`,
          relatedId: after.id,
        }).catch(() => {});
      } catch {
        // non-fatal
      }
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
      ticket.status = 'in_progress';
      ticket.acceptedAt = ticket.acceptedAt ?? now;
      if (data.progressNotes?.trim()) ticket.progressNotes = data.progressNotes.trim();
    } else {
      throw new BadRequestException('Unsupported ticket status transition');
    }

    let history: any[] = [];
    try {
      history = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
      if (!Array.isArray(history)) history = [{ entry: ticket.statusHistory }];
    } catch {
      history = [{ entry: ticket.statusHistory }];
    }
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
    }).catch(() => {});
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

  countOpen() {
    return this.repo.createQueryBuilder('ticket')
      .where('ticket.status NOT IN (:...done)', { done: ['resolved', 'closed', 'cancelled'] })
      .getCount();
  }

  countByStatus(status: string) {
    return this.repo.countBy({ status: status as any });
  }
}
