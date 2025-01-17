import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Billing_History } from './entities/billing_history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { GetBillingHistoryFilterDto } from './dto/getBillingHistory.dto';
import { CallHistory } from '../calls/entities/call.entity';
import { UsersService } from '../users/users.service';
import { Roles } from '../users/enums/roles.enum';
import { Bill } from './entities/bills.entity';
import { Billing_Status } from './enum/billingStatus.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing_History)
    private billingHistoryRepository: Repository<Billing_History>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    private userService: UsersService,
  ) {}
  async create(createBillingDto: CreateBillingDto) {
    const billHistory = this.billingHistoryRepository.create(createBillingDto);
    return await this.billingHistoryRepository.save(billHistory);
  }
  async getBillingHistory(filterDto: GetBillingHistoryFilterDto, user?: any) {
    const { filter } = filterDto;
    const query = this.billingHistoryRepository
      .createQueryBuilder('billing')
      // .leftJoin('billing.interpreter', 'interpreter');
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

    if (user.role === Roles.SUB_ADMIN) {
      query.andWhere('interpreter.addedBy = :addedBy', {
        addedBy: user.sub, // Assuming 'user.sub' is the ID of the sub-admin
      });
    }

    const billingHistories = await query.getMany();
    return billingHistories;
  }
  async interBillHistory(userId: number) {
    const bills = await this.billingHistoryRepository
      .createQueryBuilder('billing')
      .leftJoin('billing.interpreter', 'interpreter')
      .andWhere('interpreter.id = :userId', { userId })
      .getMany();

    return bills;
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
    const user = await this.userService.findById(userId);
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

  async fetchBills(userType?: string, status?: Billing_Status) {
    if (!userType) {
      throw new BadRequestException('User type is required');
    }

    const query = this.billRepository.createQueryBuilder('bill');
    query.leftJoinAndSelect('bill.user', 'user');
    query.where('bill.role = :userType', { userType });
    // Fetching based on user ID

    // Optional status filter
    if (status !== null && status !== undefined) {
      query.andWhere('bill.status = :status', { status });
    }

    // Optional sorting (e.g., by date)
    query.orderBy('bill.createdAt', 'DESC');

    // Debugging: Log generated SQL for troubleshooting

    const bills = await query.getMany();
    return bills;
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
