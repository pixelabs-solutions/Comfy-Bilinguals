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
    const { startDate, endDate } = this.calculateDateRange(timeRange, date);

    // Fetch general stats within the date range
    const newCalls = await this.callHistoryRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });

    const newInterpreters = await this.userRepository.count({
      where: {
        role: Roles.INTERPRETER,
        createdAt: Between(startDate, endDate),
      },
    });
    // console.log(newInterpreters);

    const newClients = await this.userRepository.count({
      where: { role: Roles.CLIENT, createdAt: Between(startDate, endDate) },
    });

    let interactionsByPeriod = [];

    if (timeRange === 'weekly') {
      interactionsByPeriod = await this.getWeeklyInteractions(
        startDate,
        endDate,
      );
    } else if (timeRange === 'monthly') {
      interactionsByPeriod = await this.getInteractionsByWeek(
        startDate,
        endDate,
      );
    } else if (timeRange === 'yearly') {
      interactionsByPeriod = await this.getInteractionsByMonth(
        startDate,
        endDate,
      );
    }

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
      interactionsByPeriod,
      activeInterpreters: await this.getActiveInterpretersCount(
        Roles.INTERPRETER,
      ),
    };
  }

  async getInteractionsByWeek(startDate: Date, endDate: Date) {
    const interactions = await this.callHistoryRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const weeklyInteractions = Array(4).fill(0); // For 4 weeks

    interactions.forEach((interaction) => {
      const diff = Math.floor(
        (new Date(interaction.createdAt).getTime() - startDate.getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      ); // Calculate which week it falls in
      if (diff < 4) weeklyInteractions[diff]++;
    });

    return weeklyInteractions.map((count, index) => ({
      week: index + 1,
      count,
    }));
  }

  async getInteractionsByMonth(startDate: Date, endDate: Date) {
    const interactions = await this.callHistoryRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const monthlyInteractions = Array(12).fill(0); // For 12 months

    interactions.forEach((interaction) => {
      const monthIndex =
        new Date(interaction.createdAt).getMonth() - startDate.getMonth();
      monthlyInteractions[monthIndex]++;
    });

    return monthlyInteractions.map((count, index) => ({
      month: index + 1,
      count,
    }));
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
    const endDate = new Date(referenceDate);
    let startDate: Date;

    switch (timeRange) {
      case 'weekly':
        // For weekly, we go back 7 days
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;

      case 'monthly':
        // For monthly, go back 4 weeks (28 days)
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 28); // 4 weeks
        break;

      case 'yearly':
        // For yearly, go back 12 months
        startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;

      default:
        throw new Error('Invalid time range provided');
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
    // Adjust the previous date range to be before the current period

    // console.log(currentCount);
    const previousPeriodEnd = new Date(referenceDate);

    let previousPeriodStart: Date;
    let currentPeriodStart: Date;

    switch (timeRange) {
      case 'weekly':
        previousPeriodEnd.setDate(referenceDate.getDate() - 7);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodEnd.getDate() - 7);
        currentPeriodStart = new Date(referenceDate);
        currentPeriodStart.setDate(referenceDate.getDate() - 7);
        break;

      case 'monthly':
        previousPeriodEnd.setMonth(referenceDate.getMonth() - 1);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setMonth(previousPeriodEnd.getMonth() - 1);
        currentPeriodStart = new Date(referenceDate);
        currentPeriodStart.setMonth(referenceDate.getMonth() - 1);
        break;

      case 'yearly':
        previousPeriodEnd.setFullYear(referenceDate.getFullYear() - 1);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setFullYear(previousPeriodEnd.getFullYear() - 1);
        currentPeriodStart = new Date(referenceDate);
        currentPeriodStart.setFullYear(referenceDate.getFullYear() - 1);
        break;

      default:
        throw new Error('Invalid time range provided');
    }

    let previousCount: number;

    switch (metric) {
      case 'calls':
        previousCount = await this.callHistoryRepository.count({
          where: { createdAt: Between(previousPeriodStart, previousPeriodEnd) },
        });
        break;
      case 'interpreters':
        previousCount = await this.userRepository.count({
          where: {
            role: Roles.INTERPRETER,
            createdAt: Between(previousPeriodStart, previousPeriodEnd),
          },
        });
        break;
      case 'clients':
        previousCount = await this.userRepository.count({
          where: {
            role: Roles.CLIENT,
            createdAt: Between(previousPeriodStart, previousPeriodEnd),
          },
        });
        break;
      default:
        previousCount = 0;
    }

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    // console.log('PCOUNT', previousCount, currentCount);
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
