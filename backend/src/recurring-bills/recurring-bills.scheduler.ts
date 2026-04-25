import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RecurringBillsService } from './recurring-bills.service';

@Injectable()
export class RecurringBillsScheduler {
  private readonly logger = new Logger(RecurringBillsScheduler.name);

  constructor(private readonly recurringBillsService: RecurringBillsService) {}

  @Cron('5 0 * * *')
  async handleCron() {
    this.logger.log('Running recurring bill auto-generation');
    const generatedCount =
      await this.recurringBillsService.generateBillsForAllUsers();
    this.logger.log(
      `Recurring generation completed with ${generatedCount} bill${generatedCount === 1 ? '' : 's'} created`,
    );
  }
}
