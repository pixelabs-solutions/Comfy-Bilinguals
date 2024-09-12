import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './orm.config';
import { UsersModule } from './modules/users/users.module';
import { BillingModule } from './modules/billing/billing.module';
import { CallsModule } from './modules/calls/calls.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRoot(config),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    BillingModule,
    CallsModule,
    AdminModule,
    NotificationsModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
