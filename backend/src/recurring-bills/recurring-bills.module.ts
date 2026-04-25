import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecurringBillsService } from './recurring-bills.service';
import { RecurringBillsController } from './recurring-bills.controller';
import { RecurringBill } from './recurring-bill.entity';
import { Bill } from '../bills/bill.entity';
import { RecurringBillsScheduler } from './recurring-bills.scheduler'; // ✅ ADD THIS

@Module({
  imports: [TypeOrmModule.forFeature([RecurringBill, Bill])],
  providers: [
    RecurringBillsService,
    RecurringBillsScheduler, // ✅ ADD THIS (AUTO ENGINE)
  ],
  controllers: [RecurringBillsController],
})
export class RecurringBillsModule {}