import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallHistory } from './entities/call.entity';
import { Billing_History } from '../billing/entities/billing_history.entity';
import { UsersModule } from '../users/users.module';
import { BillingService } from '../billing/billing.service';
import { AdminService } from '../admin/admin.service';
import { User } from '../users/entities/user.entity';
import { Bill } from '../billing/entities/bills.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallHistory, Billing_History, User, Bill]),
    UsersModule,
  ],
  controllers: [CallsController],
  providers: [CallsService, BillingService, AdminService],
})
export class CallsModule {}
