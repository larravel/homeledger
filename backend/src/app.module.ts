import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // ✅ ADD THIS

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { RecurringBillsModule } from './recurring-bills/recurring-bills.module';
import { ExpenseModule } from './expenses/expense.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ScheduleModule.forRoot(), // ✅ ADD THIS (AUTO SYSTEM ENABLED)

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
    UsersModule,
    BillsModule,
    PaymentsModule,
    ReportsModule,
    RecurringBillsModule,
    ExpenseModule,
  ],
})
export class AppModule {}

