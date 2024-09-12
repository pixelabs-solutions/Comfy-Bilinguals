import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Billing } from './entities/billing.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { GetBillingHistoryFilterDto } from './dto/getBillingHistory.dto';
import { CallHistory } from '../calls/entities/call.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private billingHistoryRepository: Repository<Billing>,
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    private userService: UsersService,
  ) {}
  async create(createBillingDto: CreateBillingDto) {
    const billHistory = this.billingHistoryRepository.create(createBillingDto);
    return await this.billingHistoryRepository.save(billHistory);
  }
  async getBillingHistory(filterDto: GetBillingHistoryFilterDto) {
    const { filter } = filterDto;
    const query = this.billingHistoryRepository
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.interpreter', 'interpreter'); // Adding the interpreter relation

    if (filter) {
      const date = new Date();
      switch (filter.toLowerCase()) {
        case 'weekly':
          date.setDate(date.getDate() - 7);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() - 1);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() - 1);
          break;
        default:
          throw new Error('Invalid filter option');
      }
      query.andWhere('billing.createdAt >= :date', { date });
    }

    const billingHistories = await query.getMany();
    return billingHistories;
  }

  async subGetBillingHistory(filterDto: GetBillingHistoryFilterDto) {
    const { filter } = filterDto;
    const query = this.billingHistoryRepository
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.interpreter', 'interpreter'); // Adding the interpreter relation

    if (filter) {
      const date = new Date();
      switch (filter.toLowerCase()) {
        case 'weekly':
          date.setDate(date.getDate() - 7);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() - 1);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() - 1);
          break;
        default:
          throw new Error('Invalid filter option');
      }
      query.andWhere('billing.createdAt >= :date', { date });
    }

    const billingHistories = await query.getMany();
    return billingHistories;
  }
  async fetchAllBills(userType: string, userId: number) {
    let totalAmount = 0;
    const user = await this.userService.findbyId(userId);
    // If userType is interpreter, fetch pending bills from billing repository
    if (userType === 'interpreter') {
      const pendingBills = await this.billingHistoryRepository.find({
        where: {
          interpreter: user,
          status: 'pending', // Adjust the field name if it's different
          createdAt: LessThanOrEqual(new Date()), // Pending up to the current date
        },
      });

      // Sum all pending bills
      totalAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
    } else if (userType === 'client') {
      // If userType is client, fetch unpaid bills from calls repository
      const unpaidCalls = await this.callHistoryRepository.find({
        where: {
          client: user,
          status: 'pending', // Adjust the field name if it's different
        },
      });

      // Sum all unpaid bills
      totalAmount = unpaidCalls.reduce((sum, call) => sum + call.bill, 0);
    } else {
      throw new BadRequestException('Invalid userType');
    }

    // Return the total summed amount
    return {
      userId,
      userType,
      totalAmount,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} billing`;
  }

  update(id: number, updateBillingDto: UpdateBillingDto) {
    return `This action updates a #${id} billing`;
  }

  remove(id: number) {
    return `This action removes a #${id} billing`;
  }
}
