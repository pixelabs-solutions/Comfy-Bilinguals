import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { CallHistory } from '../calls/entities/call.entity';
import { Billing } from '../billing/entities/billing.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Admin, User, CallHistory, Billing]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
