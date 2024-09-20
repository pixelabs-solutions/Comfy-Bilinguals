import { forwardRef, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { CallHistory } from '../calls/entities/call.entity';
import { Billing_History } from '../billing/entities/billing_history.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { Bill } from '../billing/entities/bills.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Admin, CallHistory, User, Bill, Billing_History]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, UsersService],
})
export class AdminModule {}
