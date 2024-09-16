import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from './enums/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { currentUser } from '../auth/decorators/currentUser';
import { User } from './entities/user.entity';
import { BillDto } from '../billing/dto/bill.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  @UseGuards(JwtAuthGuard)
  @Get('Clients/CallHistory')
  async callHistory(@currentUser() user: User) {
    const userData = await this.usersService.findById(user['sub']);
    if (!userData || userData.role !== 'client') {
      throw new BadRequestException('provided id is invalid');
    }
    return this.usersService.clientCallHistory(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('Clients/BillHistory')
  async ClientBillHistory(@currentUser() user: User) {
    const userData = await this.usersService.findById(user['sub']);
    if (!userData || userData.role !== 'client') {
      throw new BadRequestException('provided id is invalid');
    }
    return this.usersService.clientBillHistory(user);
  }

  @Post('BillingManager/GenBill')
  async GenBills(@Body() billDto: BillDto) {
    const user = await this.usersService.findById(billDto.user.id);
    if (!user) {
      throw new BadRequestException('provided id is invalid');
    }
    return this.usersService.postBills(user, billDto);
  }
  @Patch('update/:id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @Get('manageUsers')
  async manageUsersApi(
    @Query('role') role: Roles, // "interpreter" or "client"
  ) {
    if (!role) {
      throw new BadRequestException('Role must be Specified Correctly');
    }
    return this.usersService.getFilteredUsers(role);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
