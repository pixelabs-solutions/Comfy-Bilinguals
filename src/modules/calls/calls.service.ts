import { Injectable } from '@nestjs/common';
import { CallHistoryDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Billing } from '../billing/entities/billing.entity';
import { Between, Repository } from 'typeorm';
import { CallHistory } from './entities/call.entity';

import { BillingService } from '../billing/billing.service';
import { CreateBillingDto } from '../billing/dto/create-billing.dto';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(CallHistory)
    private repository: Repository<CallHistory>,
    @InjectRepository(Billing)
    private billingHistoryRepository: Repository<Billing>,
    private adminService: AdminService,
    private billingService: BillingService,
  ) {}
  async create(createCallDto: CallHistoryDto) {
    const callHistory = this.repository.create(createCallDto);
    if (callHistory.bill) {
      const billing = {
        interpreter: callHistory.interpreter,
        status: 'pending',
        amount: callHistory.bill,
      } as CreateBillingDto;
      await this.billingService.create(billing);
    }
    return this.repository.save(callHistory);
  }

  async findAll(timeRange: 'weekly' | 'monthly' | 'yearly', date: Date) {
    // Calculate the start and end date based on the time range and input date
    const { startDate, endDate } = this.adminService.calculateDateRange(
      timeRange,
      date,
    );

    // Initialize the query builder
    const query = this.repository.createQueryBuilder('billing');

    // Add time range filter if specified
    if (timeRange) {
      query.andWhere('billing.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Fetch the data with relations to client and interpreter
    const result = await query
      .leftJoinAndSelect('billing.client', 'client')
      .leftJoinAndSelect('billing.interpreter', 'interpreter')
      .getMany();

    return {
      result,
    };
  }
  async subFindAll(timeRange: 'weekly' | 'monthly' | 'yearly', date: Date) {
    // Calculate the start and end date based on the time range and input date
    const { startDate, endDate } = this.adminService.calculateDateRange(
      timeRange,
      date,
    );

    // Initialize the query builder
    const query = this.repository.createQueryBuilder('billing');

    // Add time range filter if specified
    if (timeRange) {
      query.andWhere('billing.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Fetch the data with relations to client and interpreter
    const result = await query
      .leftJoinAndSelect('billing.client', 'client')
      .leftJoinAndSelect('billing.interpreter', 'interpreter')
      .getMany();

    return {
      result,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} call`;
  }

  update(id: number, updateCallDto: UpdateCallDto) {
    return `This action updates a #${id} call`;
  }

  remove(id: number) {
    return `This action removes a #${id} call`;
  }
}