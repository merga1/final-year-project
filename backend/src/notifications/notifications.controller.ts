import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    const audience = user.role === 'technician' ? 'technician' : user.role === 'admin' ? 'admin' : 'customer';
    const [items, unread] = await Promise.all([
      this.service.findForUser(user.sub, audience),
      this.service.unreadCount(user.sub, audience),
    ]);
    return { items, unread };
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markRead(id, user.sub);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.sub);
  }
}
