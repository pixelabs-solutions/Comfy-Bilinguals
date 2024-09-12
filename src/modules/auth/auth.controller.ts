import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  UploadedFile,
  Request,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { currentUser } from './decorators/currentUser';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { loginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async logIn(@Body() login_dto: loginDto) {
    if (login_dto) {
      return await this.authService.userLogin(login_dto);
    } else {
      throw new BadRequestException('User Credentials Invalid');
    }
  }

  // @Get('facebook')
  // @UseGuards(AuthGuard('facebook-token'))
  // async facebookLogin() {
  //   // console.log(req.user);
  //   // This route will initiate the Facebook authentication process
  //   // The FacebookStrategy will handle the authentication logic
  // }

  // @Get('facebook/callback')
  // @UseGuards(AuthGuard('facebook-token'))
  // async facebookLoginCallback() {
  //   // This route will handle the callback from Facebook after authentication
  //   // You can redirect or return a response to the client here
  // }

  // @Get()
  // @UseGuards(AuthGuard('github'))
  // async login() {
  //   //
  // }
  // @Get()
  // @UseGuards(AuthGuard('google'))
  // async googleAuth(@Req() req) {}

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req) {
  //   return this.authService.googleLogin(req);
  // }
  // @Get('callback')
  // @UseGuards(AuthGuard('github'))
  // async authCallback(@Req() req) {
  //   const user = req.user;
  //   console.log(user);
  //   const payload = { sub: user.id, username: user.username };
  //   return { accessToken: this.jwtService.sign(payload) };
  // }
  @Post('refresh-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: any, @currentUser() user: User) {
    console.log('User INFO', user);
    return this.authService.refreshToken(user);
  }

  @Delete('remove/User/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delUser(@Param('id') id: number) {
    return await this.authService.delUser(+id);
  }
}
