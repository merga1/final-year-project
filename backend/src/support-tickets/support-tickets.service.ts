import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { Customer } from '../customers/customer.entity';
import { Device } from '../devices/device.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TechniciansService } from '../technicians/technicians.service';
import {
  AdminCreateTicketDto, AdminUpdateTicketDto, TechnicianTransitionDto,
} from './dto/ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    private readonly notifications: NotificationsService,
    private readonly technicians: TechniciansService,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findRecent(limit: number) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findOne(id: string) {
    const ticket = await this.repo.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async findOneForCustomer(id: string, customerId: string) {
    const ticket = await this.repo.findOneBy({ id, customerId });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  /**
   * The mobile dashboard groups several raw statuses under one chip:
   * "Assigned" = assigned/open/pending, "Accepted" = accepted/in_progress.
   * This matches the counts returned by `getTechnicianHome`.
   */
  private statusGroup(status?: string): string[] | undefined {
    if (!status) return undefined;
    if (status === 'assigned') return ['assigned', 'open', 'pending'];
    if (status === 'accepted') return ['accepted', 'in_progress'];
    return [status];
  }

  findByTechnician(technicianId: string, status?: string) {
    const group = this.statusGroup(status);
    return this.repo.find({
      where: { technicianId, ...(group ? { status: In(group) as any } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForTechnician(id: string, technicianId: string) {
    const ticket = await this.repo.findOneBy({ id, technicianId });
    if (!ticket) throw new NotFoundException('Ticket not found or not assigned to you');
    return ticket;
  }

  async createAdminTicket(dto: AdminCreateTicketDto) {
    let technicianName = dto.technicianName;
    if (dto.technicianId && !technicianName) {
      technicianName = (await this.technicians.findOne(dto.technicianId).catch(() => null))?.name;
    }
    const status = (dto.technicianId ? 'assigned' : dto.status || 'pending') as SupportTicket['status'];
    const now = new Date();
    const saved = await this.repo.save(
      this.repo.create({
        customerId: dto.customerId,
        customerName: dto.customerName,
        type: dto.type,
        issue: dto.issue,
        description: dto.description,
        priority: dto.priority,
        customerAddress: dto.customerAddress,
        deviceId: dto.deviceId,
        status,
        subject: dto.subject || dto.issue || dto.description || 'Alert Escalation',
        technicianId: dto.technicianId ?? null,
        technicianName: technicianName ?? null,
        assignedAt: dto.technicianId ? now : null,
        statusHistory: JSON.stringify([{ status, at: now.toISOString(), note: 'Created by Admin from Alert dispatch' }]),
      }),
    );
    if (dto.technicianId) {
      await this.adjustWorkload(dto.technicianId, +1);
      await this.notifications.create({
        userId: dto.technicianId,
        audience: 'technician',
        type: 'ticket_assignment',
        title: 'New ticket assigned from Alert',
        message: `${saved.type}: ${saved.description ?? saved.issue}`,
        relatedId: saved.id,
      });
    }
    return saved;
  }

  async createCustomerTicket(data: Partial<SupportTicket>) {
    const now = new Date();
    const ticket = this.repo.create({
      customerId: data.customerId,
      customerName: data.customerName,
      type: data.type,
      issue: data.issue,
      description: data.description,
      priority: data.priority,
      customerAddress: data.customerAddress,
      deviceId: data.deviceId,
      status: 'pending',
      subject: data.subject || data.issue || data.description || 'Customer Support',
      technicianId: null,
      technicianName: null,
      assignedAt: null,
      statusHistory: JSON.stringify([{
        status: 'pending',
        at: now.toISOString(),
        note: 'Submitted by customer; waiting for admin assignment',
      }]),
    });
    const saved = await this.repo.save(ticket);

    if (saved.customerId) {
      try {
        await this.notifications.create({
          userId: saved.customerId,
          audience: 'customer',
          type: 'ticket_received',
          title: 'Request received',
          message: 'Your request is in the admin queue. An admin will assign a technician.',
          relatedId: saved.id,
        });
      } catch {
        // Notifications are non-fatal; the ticket itself was saved.
      }
    }
    return saved;
  }

  async update(id: string, data: AdminUpdateTicketDto) {
    const before = await this.repo.findOneBy({ id });
    if (!before) throw new NotFoundException('Ticket not found');

    const updatePayload: Partial<SupportTicket> = {};

    // 1. Record status and assignment changes in the ticket history
    const reasonText = data.reassignReason || data.reason || data.notes;
    if (reasonText) updatePayload.notes = reasonText;
    if (reasonText || data.status !== undefined || data.technicianId !== undefined) {
      let historyArr: any[] = [];
      try {
        if (before.statusHistory) {
          historyArr = JSON.parse(before.statusHistory);
          if (!Array.isArray(historyArr)) historyArr = [{ entry: before.statusHistory }];
        }
      } catch {
        historyArr = [{ entry: before.statusHistory }];
      }
      const historyEntry: Record<string, unknown> = {
        status: data.status || before.status,
        at: new Date().toISOString(),
      };
      if (reasonText) historyEntry.note = reasonText;
      if (data.technicianId !== undefined) {
        historyEntry.technicianId = data.technicianId;
      }
      historyArr.push(historyEntry);
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
            if (before.technicianId !== data.technicianId) {
              await this.adjustWorkload(newTech.id, +1);
            }
          }
        } catch (techErr) {
          console.warn('Could not load technician details:', techErr);
        }

        // Decrement workload for previous technician if reassigned
        if (before.technicianId && before.technicianId !== data.technicianId) {
          await this.adjustWorkload(before.technicianId, -1);
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
      updatePayload.status = data.status as SupportTicket['status'];
      if (data.status === 'resolved' && !before.resolvedAt) {
        updatePayload.resolvedAt = new Date();
      }
      if (data.status === 'accepted' && !before.acceptedAt) {
        updatePayload.acceptedAt = new Date();
      }

      // Resolving a water meter request links the device. Registration tickets no longer gate login.
      if (data.status === 'resolved' && before.status !== 'resolved' && before.customerId) {
        const isMeterReq =
          before.type === 'Water Meter Request' ||
          before.issue?.toLowerCase().includes('water meter');
        const isRegistration =
          before.type === 'New Customer Registration' ||
          before.issue?.toLowerCase().includes('registration');

        if (isMeterReq || isRegistration) {
          try {
            const customer = await this.customerRepo.findOneBy({ id: before.customerId });
            if (customer) {
              const assignedMeter = (data.deviceId || before.deviceId || customer.meterId)?.trim();
              const customerUpdates: Partial<Customer> = { accountStatus: 'active' };
              if (isMeterReq && assignedMeter) {
                customerUpdates.meterId = assignedMeter;
                await this.deviceRepo.update({ meterId: assignedMeter }, { customerId: customer.id });
                updatePayload.deviceId = assignedMeter;
              }
              await this.customerRepo.update(customer.id, customerUpdates);
            }
          } catch (custErr) {
            console.warn('Could not update customer on ticket resolution:', custErr);
          }
        }
      }
    }

    // 4. Whitelisted SupportTicket entity fields only
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.issue !== undefined) updatePayload.issue = data.issue;
    if (data.subject !== undefined) updatePayload.subject = data.subject;
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

  /**
   * Customer approves or rejects a completed water-meter installation.
   * Approve → resolve ticket and ensure the meter is active for usage.
   * Reject → return ticket to the technician as in_progress.
   */
  async customerDecideInstallation(
    id: string,
    customerId: string,
    decision: 'approve' | 'reject',
    notes?: string,
  ) {
    const ticket = await this.findOneForCustomer(id, customerId);
    if (ticket.status !== 'awaiting_customer') {
      throw new BadRequestException('This ticket is not waiting for your approval');
    }

    const isMeterInstall =
      ticket.type === 'Water Meter Request' ||
      ticket.issue?.toLowerCase().includes('water meter');
    if (!isMeterInstall) {
      throw new BadRequestException('Only water meter installations require customer approval');
    }

    const now = new Date();
    let history: any[] = [];
    try {
      history = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
      if (!Array.isArray(history)) history = [{ entry: ticket.statusHistory }];
    } catch {
      history = [];
    }

    if (decision === 'approve') {
      ticket.status = 'resolved';
      ticket.resolvedAt = now;
      ticket.notes = [
        ticket.notes,
        notes?.trim() ? `Customer approval: ${notes.trim()}` : 'Customer approved the installed meter',
      ]
        .filter(Boolean)
        .join('\n');

      const meterId = (ticket.deviceId || '').trim();
      if (meterId) {
        await this.customerRepo.update(customerId, {
          meterId,
          accountStatus: 'active',
        });
        await this.deviceRepo.update(
          { meterId },
          { customerId, connectivity: 'ONLINE' },
        );
      }

      if (ticket.technicianId) {
        await this.decrementWorkload(ticket.technicianId, true);
        await this.notifications.create({
          userId: ticket.technicianId,
          audience: 'technician',
          type: 'ticket_status',
          title: 'Customer approved installation',
          message: `${ticket.customerName} approved the water meter installation.`,
          relatedId: ticket.id,
        }).catch(() => {});
      }
    } else {
      ticket.status = 'in_progress';
      ticket.rejectionReason = notes?.trim() || 'Customer rejected the installation';
      history.push({
        status: 'awaiting_customer_rejected',
        at: now.toISOString(),
        by: customerId,
        note: ticket.rejectionReason,
      });
      if (ticket.technicianId) {
        await this.notifications.create({
          userId: ticket.technicianId,
          audience: 'technician',
          type: 'ticket_status',
          title: 'Customer requested changes',
          message: `${ticket.customerName} rejected the installation. Please continue work.`,
          relatedId: ticket.id,
        }).catch(() => {});
      }
    }

    history.push({
      status: ticket.status,
      at: now.toISOString(),
      by: customerId,
      note: decision === 'approve' ? 'Customer approved' : 'Customer rejected',
    });
    ticket.statusHistory = JSON.stringify(history);
    return this.repo.save(ticket);
  }

  /** Close obsolete registration-approval tickets created by older backend builds. */
  async closeLegacyRegistrationTickets(customerId?: string) {
    const where: any = {
      status: In(['pending', 'open', 'assigned', 'accepted', 'in_progress'] as any),
    };
    if (customerId) where.customerId = customerId;
    const tickets = await this.repo.find({ where });
    const now = new Date();
    for (const ticket of tickets) {
      const isRegistration =
        ticket.type === 'New Customer Registration' ||
        ticket.issue?.toLowerCase().includes('registration approval') ||
        ticket.description?.toLowerCase().includes('awaiting administrator approval');
      if (!isRegistration) continue;
      ticket.status = 'resolved';
      ticket.resolvedAt = now;
      ticket.notes = 'Closed automatically — registration no longer requires admin approval';
      await this.repo.save(ticket);
    }
  }

  async transitionForTechnician(
    id: string,
    technicianId: string,
    data: TechnicianTransitionDto,
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
    } else if (requested === 'awaiting_customer' || requested === 'resolved') {
      // Water-meter installs wait for customer approval; other tickets resolve immediately.
      if (!['accepted', 'in_progress'].includes(current)) {
        throw new BadRequestException('Accept the ticket before completing it');
      }
      if (!data.notes?.trim()) throw new BadRequestException('Completion notes are required');
      const isMeterInstall =
        ticket.type === 'Water Meter Request' ||
        ticket.issue?.toLowerCase().includes('water meter');
      ticket.status = isMeterInstall || requested === 'awaiting_customer'
        ? 'awaiting_customer'
        : 'resolved';
      ticket.notes = data.notes.trim();
      ticket.progressNotes = data.progressNotes?.trim() || ticket.progressNotes;
      if (ticket.status === 'resolved') {
        ticket.resolvedAt = now;
        await this.decrementWorkload(technicianId, true);
      }
    } else if (requested === 'closed') {
      if (current !== 'resolved') throw new BadRequestException('Only resolved tickets can be closed');
      ticket.status = 'closed';
    } else if (requested === 'accepted' || requested === 'in_progress') {
      if (current === 'awaiting_customer') {
        // Customer rejected installation — technician continues work.
        ticket.status = 'in_progress';
        if (data.progressNotes?.trim()) ticket.progressNotes = data.progressNotes.trim();
      } else {
        ticket.status = 'in_progress';
        ticket.acceptedAt = ticket.acceptedAt ?? now;
        if (data.progressNotes?.trim()) ticket.progressNotes = data.progressNotes.trim();
      }
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
    const customerMessage =
      saved.status === 'awaiting_customer'
        ? 'Your water meter was installed. Open the ticket and approve it to finish.'
        : `Your ticket is now ${saved.status}.`;
    await this.notifications.create({
      userId: saved.customerId,
      audience: 'customer',
      type: 'ticket_status',
      title: saved.status === 'awaiting_customer'
        ? 'Approve your water meter'
        : 'Support ticket updated',
      message: customerMessage,
      relatedId: saved.id,
    });
    return saved;
  }

  /** Keeps technician.currentJobCount in step with assignments (never below zero). */
  private async adjustWorkload(technicianId: string, delta: number) {
    const tech = await this.technicians.findOne(technicianId).catch(() => null);
    if (!tech) return;
    await this.technicians
      .update(technicianId, { currentJobCount: Math.max(0, (tech.currentJobCount ?? 0) + delta) })
      .catch(() => null);
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
