import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UtilityUsageService } from './utility-usage.service';
import { UtilityUsageController } from './utility-usage.controller';
import { UtilityUsage } from './utility-usage.entity';
import { Bill } from '../bills/bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UtilityUsage, Bill])],
  controllers: [UtilityUsageController],
  providers: [UtilityUsageService],
  exports: [UtilityUsageService],
})
export class UtilityUsageModule {}