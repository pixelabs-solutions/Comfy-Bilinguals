import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import path from 'path';
import { AuthService } from '../auth/auth.service';
import { FormDataValidationPipe } from '../utils/FormDataValidationPipe ';
import { Roles } from '../users/enums/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { currentUser } from '../auth/decorators/currentUser';
import { User } from '../users/entities/user.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private authService: AuthService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('AddUser')
  async addUser(
    @Body() userDto: CreateUserDto,
    @UploadedFile('profileImage') profileImage,
    @currentUser() user: User,
  ) {
    console.log(profileImage);
    if (userDto) {
      if (profileImage) {
        console.log(profileImage.originalname);
        // Move files to uploads folder
        const profileImagePath = path.join(
          __dirname,
          '../../uploads',
          'uploads',
          profileImage.originalname,
        );
        fs.writeFileSync(profileImagePath, profileImage.buffer);

        // Save file paths to database
        // userDto.profile_Image = profileImagePath;
        // userDto.cnic_Image = cnicImagePath;
      }

      return await this.authService.userSignUp(userDto, user['sub']);
    } else {
      throw new BadRequestException('All fields are Required');
    }
  }

  @Get('dashboard/kpis')
  async findAll(
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    return this.adminService.getKpis(timeRange, referenceDate);
  }

  @Get('subAdmin/dashboard/kpis')
  async subAdminKpis(
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    return this.adminService.subAdminGetKpis(timeRange, referenceDate);
  }

  @Get('manageUser')
  async findOne(@Param('id') id: string) {
    return await this.adminService.findOne(+id);
  }

  @Get('pendingUsers')
  async findPendingUsers(@Query('role') role: Roles) {
    // if (!role) {
    //   throw new BadRequestException('Role must be Specified Correctly');
    // }
    return await this.adminService.pendingUsers(role);
  }

  @Get('Payments')
  async getPayments(@Query('period') period: 'week' | 'month' | 'year') {
    return this.adminService.getPayments({ period });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
