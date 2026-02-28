import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

// ─── Customers ────────────────────────────────────────────────────────────────
import { CustomersService } from './customers/customers.service';
import { CustomersController } from './customers/customers.controller';

// ─── Repair Orders ────────────────────────────────────────────────────────────
import { RepairOrdersService } from './repair-orders/repair-orders.service';
import { RepairOrdersController } from './repair-orders/repair-orders.controller';

// ─── Expenses ─────────────────────────────────────────────────────────────────
import { ExpensesService } from './expenses/expenses.service';
import { ExpensesController } from './expenses/expenses.controller';

// ─── Analytics ────────────────────────────────────────────────────────────────
import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsController } from './analytics/analytics.controller';

// ─── Public Tracking ──────────────────────────────────────────────────────────
import { PublicTrackingController } from './public/public-tracking.controller';

// ─── Events ───────────────────────────────────────────────────────────────────
import { RepairEventListeners } from './events/repair.listeners';

@Module({
  imports: [
    PrismaModule,
    // Provides EmailService for repair notification listeners
    NotificationsModule,
  ],
  controllers: [
    CustomersController,
    RepairOrdersController,
    ExpensesController,
    AnalyticsController,
    PublicTrackingController,
  ],
  providers: [
    CustomersService,
    RepairOrdersService,
    ExpensesService,
    AnalyticsService,
    RepairEventListeners,
  ],
  exports: [RepairOrdersService, CustomersService],
})
export class RepairManagementModule {}
