import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { UpdateCallDto } from './dto/update-call.dto';
import { CallHistoryDto } from './dto/create-call.dto';
import { UsersService } from '../users/users.service';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly userService: UsersService,
  ) {}

  @Post('initiate')
  async create(@Body() createCallDto: CallHistoryDto) {
    console.log(createCallDto);
    // const client = await this.userService.findbyId(createCallDto.client);
    return await this.callsService.create(createCallDto);
  }

  @Get('callHistory')
  async findAll(
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    return await this.callsService.findAll(timeRange, referenceDate);
  }

  @Get('subAdmin/CallHistory')
  async subAdminCallHistory(
    @Query('timeRange') timeRange: 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    const referenceDate = date ? new Date(date) : new Date();
    return await this.callsService.subFindAll(timeRange, referenceDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCallDto: UpdateCallDto) {
    return this.callsService.update(+id, updateCallDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.callsService.remove(+id);
  }
}
