// admin.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { request } from 'http';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { User } = context.switchToHttp().getRequest();
    console.log('Request Object:', request);

    // const { User } = request;
    // console.log('User Object:', user);

    return User.role === 'Admin';
  }
}
