import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { GetBillingHistoryFilterDto } from './dto/getBillingHistory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { currentUser } from '../auth/decorators/currentUser';
import { User } from '../users/entities/user.entity';
import { Billing_Status } from './enum/billingStatus.enum';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('addBills')
  async create(@Body() createBillingDto: CreateBillingDto) {
    return await this.billingService.create(createBillingDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('billHistory')
  async getBillingHistory(
    @currentUser() user: User,
    @Query() filterDto: GetBillingHistoryFilterDto,
  ) {
    return this.billingService.getBillingHistory(filterDto, user);
  }
  @Get('subAdmin/BillHistory')
  async subBillingHistory(@Query() filterDto: GetBillingHistoryFilterDto) {
    return this.billingService.subGetBillingHistory(filterDto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('Interpreter/billHistory')
  async getInterpreterBillingHistory(@currentUser() user: User) {
    return this.billingService.interBillHistory(user['sub']);
  }

  @Get('fetch/Bills')
  async fetchBills(@Query('userType') userType: string, id: number) {
    return this.billingService.fetchAllBills(userType, id);
  }

  @Get('billingManager/fetch/Bills')
  async getBills(
    // @Query('userType') userType: string,
    @Query('userType') userType?: string,
    @Query('status')
    status?: Billing_Status,
  ) {
    return this.billingService.fetchBills(userType, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillingDto: UpdateBillingDto) {
    return this.billingService.update(+id, updateBillingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billingService.remove(+id);
  }
}
