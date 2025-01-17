import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Billing_History } from './entities/billing_history.entity';
import { CallHistory } from '../calls/entities/call.entity';
import { UsersModule } from '../users/users.module';
import { Bill } from './entities/bills.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Billing_History, CallHistory, Bill]),
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
