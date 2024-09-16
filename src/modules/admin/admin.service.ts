import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CallHistory } from '../calls/entities/call.entity';
import { User } from '../users/entities/user.entity';
import { endOfDay, startOfDay, subDays, subMonths, subYears } from 'date-fns';
import { Roles } from '../users/enums/roles.enum';
import { Billing_History } from '../billing/entities/billing_history.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CallHistory)
    private callHistoryRepository: Repository<CallHistory>,
    @InjectRepository(Billing_History)
    private billingRepository: Repository<Billing_History>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  create(createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin';
  }

  findAll() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  async pendingUsers(role: string) {
    const users = await this.userRepository.find({
      where: { role: role, approved: 'false' },
    });
    const count = await this.userRepository.count({
      where: { approved: 'false' },
    });
    return {
      users,
      count,
    };
  }

  async getPayments(filter: { period: 'week' | 'month' | 'year' }) {
    const now = new Date();
    let startDate: Date;

    // Determine the start date based on the selected period
    switch (filter.period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        throw new Error('Invalid period');
    }

    // Get total client payments (sum of bills in the call repository)
    const clientPaymentsResult = await this.callHistoryRepository
      .createQueryBuilder('call')
      .where('call.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate: new Date(),
      })
      .select('SUM(call.bill)', 'totalClients')
      .getRawOne();

    // Parse the sum result, default to 0 if null
    const totalClients = parseFloat(clientPaymentsResult.totalClients || '0');

    // Get total interpreter payments (sum of amounts in the billing repository)
    const interpreterPaymentsResult = await this.billingRepository
      .createQueryBuilder('billing')
      .where('billing.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate: new Date(),
      })
      // .andWhere('billing.status = :status', { status: 'cleared' })
      .select('SUM(billing.amount)', 'totalInterpreters')
      .getRawOne();

    // Parse the sum result, default to 0 if null
    const totalInterpreters = parseFloat(
      interpreterPaymentsResult.totalInterpreters || '0',
    );

    // Calculate payment after deduction
    const paymentAfterDeduction = totalClients - totalInterpreters;

    // Return the results
    return {
      paymentAfterDeduction,
      interpreters: totalInterpreters,
      clients: totalClients,
    };
  }

  async getKpis(timeRange: 'weekly' | 'monthly' | 'yearly', date: Date) {
    // Calculate the date range based on timeRange and current or provided date
    const { startDate, endDate } = this.calculateDateRange(timeRange, date);

    // Fetch data for KPIs
    const newCalls = await this.callHistoryRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    const newInterpreters = await this.userRepository.count({
      where: {
        role: Roles.INTERPRETER,
        createdAt: Between(startDate, endDate),
      },
    });

    const newClients = await this.userRepository.count({
      where: { role: Roles.CLIENT, createdAt: Between(startDate, endDate) },
    });

    // Weekly interactions (for timeRange: 'weekly' only)
    const weeklyInteractions =
      timeRange === 'weekly'
        ? await this.getWeeklyInteractions(startDate, endDate)
        : [];

    return {
      newCalls: {
        count: newCalls,
        percentageChange: await this.calculatePercentageChange(
          'calls',
          newCalls,
          timeRange,
          date,
        ),
      },
      newInterpreters: {
        count: newInterpreters,
        percentageChange: await this.calculatePercentageChange(
          'interpreters',
          newInterpreters,
          timeRange,
          date,
        ),
      },
      newClients: {
        count: newClients,
        percentageChange: await this.calculatePercentageChange(
          'clients',
          newClients,
          timeRange,
          date,
        ),
      },
      weeklyInteractions,
      activeInterpreters: await this.getActiveInterpretersCount(
        Roles.INTERPRETER,
      ),
    };
  }
  async subAdminGetKpis(
    timeRange: 'weekly' | 'monthly' | 'yearly',
    date: Date,
  ) {
    // Calculate the date range based on timeRange and current or provided date
    const { startDate, endDate } = this.calculateDateRange(timeRange, date);

    // Fetch data for KPIs
    const newCalls = await this.callHistoryRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    const newInterpreters = await this.userRepository.count({
      where: {
        role: Roles.INTERPRETER,
        createdAt: Between(startDate, endDate),
      },
    });

    const newClients = await this.userRepository.count({
      where: { role: Roles.CLIENT, createdAt: Between(startDate, endDate) },
    });

    // Weekly interactions (for timeRange: 'weekly' only)
    const weeklyInteractions =
      timeRange === 'weekly'
        ? await this.getWeeklyInteractions(startDate, endDate)
        : [];

    return {
      newCalls: {
        count: newCalls,
        percentageChange: await this.calculatePercentageChange(
          'calls',
          newCalls,
          timeRange,
          date,
        ),
      },
      newInterpreters: {
        count: newInterpreters,
        percentageChange: await this.calculatePercentageChange(
          'interpreters',
          newInterpreters,
          timeRange,
          date,
        ),
      },
      newClients: {
        count: newClients,
        percentageChange: await this.calculatePercentageChange(
          'clients',
          newClients,
          timeRange,
          date,
        ),
      },
      weeklyInteractions,
      activeInterpreters: await this.getActiveInterpretersCount(
        Roles.INTERPRETER,
      ),
    };
  }

  calculateDateRange(
    timeRange: 'weekly' | 'monthly' | 'yearly',
    referenceDate: Date,
  ) {
    const endDate = endOfDay(referenceDate); // End date is the end of the reference day
    let startDate: Date;

    switch (timeRange) {
      case 'weekly':
        startDate = subDays(endDate, 6); // Last 7 days
        break;
      case 'monthly':
        startDate = subMonths(endDate, 1); // Last month
        break;
      case 'yearly':
        startDate = subYears(endDate, 1); // Last year
        break;
      default:
        startDate = startOfDay(referenceDate); // Default to just today if none matched
    }

    return { startDate, endDate };
  }

  async getWeeklyInteractions(startDate: Date, endDate: Date) {
    // Get all interactions between the start and end date
    const interactions = await this.callHistoryRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const weeklyInteractions = Array(7).fill(0);

    // Fill in the daily interactions
    interactions.forEach((interaction) => {
      const dayIndex = (new Date(interaction.createdAt).getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
      weeklyInteractions[dayIndex]++;
    });

    return weeklyInteractions.map((count, index) => ({
      day: index + 1,
      count,
    }));
  }

  async calculatePercentageChange(
    metric: 'calls' | 'interpreters' | 'clients',
    currentCount: number,
    timeRange: 'weekly' | 'monthly' | 'yearly',
    referenceDate: Date,
  ): Promise<number> {
    const { startDate: prevStartDate, endDate: prevEndDate } =
      this.calculateDateRange(timeRange, referenceDate);

    let previousCount: number;

    switch (metric) {
      case 'calls':
        previousCount = await this.callHistoryRepository.count({
          where: { createdAt: Between(prevStartDate, prevEndDate) },
        });
        break;
      case 'interpreters':
        previousCount = await this.userRepository.count({
          where: {
            role: Roles.INTERPRETER,
            createdAt: Between(prevStartDate, prevEndDate),
          },
        });
        break;
      case 'clients':
        previousCount = await this.userRepository.count({
          where: {
            role: Roles.CLIENT,
            createdAt: Between(prevStartDate, prevEndDate),
          },
        });
        break;
      default:
        previousCount = 0;
    }

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;

    return ((currentCount - previousCount) / previousCount) * 100;
  }

  async getActiveInterpretersCount(role: Roles): Promise<number> {
    const activeInterpretersCount = await this.userRepository.count({
      where: { role: role, status: 'active' },
    });
    return activeInterpretersCount;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
