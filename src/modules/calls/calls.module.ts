import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallHistory } from './entities/call.entity';
import { Billing } from '../billing/entities/billing.entity';
import { UsersModule } from '../users/users.module';
import { BillingService } from '../billing/billing.service';
import { AdminService } from '../admin/admin.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallHistory, Billing, User]),
    UsersModule,
  ],
  controllers: [CallsController],
  providers: [CallsService, BillingService, AdminService],
})
export class CallsModule {}
