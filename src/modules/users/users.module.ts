import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AdminModule } from '../admin/admin.module';
import { AdminService } from '../admin/admin.service';
import { CallHistory } from '../calls/entities/call.entity';
import { Billing_History } from '../billing/entities/billing_history.entity';
import { Bill } from '../billing/entities/bills.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CallHistory, Billing_History, Bill]),
    forwardRef(() => AdminModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, AdminService],
  exports: [UsersService],
})
export class UsersModule {}
