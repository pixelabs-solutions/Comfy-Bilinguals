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
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { GetBillingHistoryFilterDto } from './dto/getBillingHistory.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('addBills')
  async create(@Body() createBillingDto: CreateBillingDto) {
    return await this.billingService.create(createBillingDto);
  }
  @Get('billHistory')
  async getBillingHistory(@Query() filterDto: GetBillingHistoryFilterDto) {
    return this.billingService.getBillingHistory(filterDto);
  }
  @Get('subAdmin/BillHistory')
  async subBillingHistory(@Query() filterDto: GetBillingHistoryFilterDto) {
    return this.billingService.subGetBillingHistory(filterDto);
  }

  @Get('Generate/Bills')
  async fetchBills(@Query('userType') userType: string, id: number) {
    return this.billingService.fetchAllBills(userType, id);
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
