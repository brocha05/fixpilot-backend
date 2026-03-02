import { Module } from '@nestjs/common';

import { RepairOrdersModule } from '../repair-orders/repair-orders.module';
import { PublicTrackingController } from './public-tracking.controller';

@Module({
  imports: [RepairOrdersModule],
  controllers: [PublicTrackingController],
})
export class PublicModule {}
