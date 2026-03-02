import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RepairOrdersService } from './repair-orders.service';
import { RepairOrdersController } from './repair-orders.controller';
import { RepairEventListeners } from './events/repair.listeners';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RepairOrdersController],
  providers: [RepairOrdersService, RepairEventListeners],
  exports: [RepairOrdersService],
})
export class RepairOrdersModule {}
