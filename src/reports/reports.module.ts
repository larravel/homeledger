import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Bill } from '../bills/bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}