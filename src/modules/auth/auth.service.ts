import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { loginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from '../utils/bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async userSignUp(userDto: CreateUserDto) {
    const userExists = await this.userService.userExists(userDto.email);

    if (userExists) {
      throw new BadRequestException('User already exists');
    } else {
      return await this.registerUser({
        ...userDto,
      });
    }
  }

  async userLogin(loginDto: loginDto) {
    console.log('user login', loginDto);
    const user = await this.userService.findOneByEmail(loginDto.email);
    // console.log(user);
    if (!user) {
      throw new BadRequestException('User Not Registered');
    }
    const verify_pass = verifyPassword(loginDto.password, user.password);
    if (user && verify_pass) {
      return await this.assignToken(user);
    }
    throw new UnauthorizedException('Invalid Credentials');
  }

  async registerUser(user: any) {
    try {
      const hashedPassword = hashPassword(user.password);
      console.log(hashedPassword);
      user.password = hashedPassword;

      return await this.userService.createUser({ ...user });
      // const token = await this.assignToken(newUser);
      // return { newUser, token };
    } catch {
      throw new BadRequestException('We will be back in a moment');
    }
  }

  async assignToken(user: any) {
    console.log(user);

    const payload = {
      username: user?.user_email || user?.email,
      sub: user?.user_id || user?.id,
      role: user?.user_role || user?.role,
      // hostel_id: hostel?.id || null,
    };
    console.log(payload);
    console.log('Signing JWT with secret:', process.env.JWT_KEY);
    return {
      access_token: this.jwtService.sign(payload),
      // refresh_token: this.jwtService.sign(payload, {
      //   expiresIn: '30m',
      // }),
    };
  }

  async refreshToken(user: any) {
    const payload = {
      username: user?.user_email || user?.username,
      sub: user?.user_id || user?.sub,
      role: user?.user_user_Role || user?.role,
      // hostel_id: hostel?.id || null,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  async validateUser(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const { ...result } = user;
      return result;
    }
    return null;
  }
  async delUser(id: number) {
    return await this.userService.remove(id);
  }
}
