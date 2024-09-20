import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AdminService } from '../admin/admin.service';
import { Roles } from './enums/roles.enum';
import { Billing_History } from '../billing/entities/billing_history.entity';
import { Billing_Status } from '../billing/enum/billingStatus.enum';
import { CallHistory } from '../calls/entities/call.entity';
import { BillDto } from '../billing/dto/bill.dto';
import { Bill } from '../billing/entities/bills.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
    @InjectRepository(CallHistory)
    private callRepository: Repository<CallHistory>,
    @InjectRepository(Billing_History)
    private billingRepository: Repository<Billing_History>,
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
    private adminService: AdminService,
  ) {}

  findAll() {
    return `This action returns all users`;
  }
  async createUser(userDto: CreateUserDto) {
    const user = this.repository.create(userDto);
    return await this.repository.save(user);
  }
  async findByEmail(email: string) {
    return this.repository.findOne({ where: { email } });
  }

  async getFilteredUsers(role: Roles, user: any) {
    const query = this.repository
      .createQueryBuilder('user')
      .select(['user.username', 'user.email', 'user.status'])
      .leftJoinAndSelect('user.addedBy', 'addedBy') // Include the 'addedBy' user
      .addSelect(['addedBy.username']) // Get addedBy user's name
      .where('user.role = :role', { role });
    console.log(user.role);
    if (user.role === Roles.SUB_ADMIN) {
      query.andWhere('user.addedBy = :addedBy', {
        addedBy: user['sub'],
      });
    }
    const users = await query.getMany();
    const activeInterpreters =
      await this.adminService.getActiveInterpretersCount(role);
    // Format the response to include the full name of the "addedBy" user
    const formattedUsers = users.map((user) => ({
      username: user.username,
      email: user.email,
      status: user.status,
      addedBy: user.addedBy
        ? `${user.addedBy.firstName} ${user.addedBy.lastName}`
        : null,
    }));

    // Return both the formatted users and the activeInterpreters count
    return {
      users: formattedUsers,
      activeCount: activeInterpreters,
    };
  }
  async clientCallHistory(user: User) {
    const history = await this.callRepository.find({
      where: { client: { id: user['sub'] } },
      order: { id: 'DESC' },
    });
    return history;
  }
  async clientBillHistory(user: User) {
    const billHistory = await this.callRepository.find({
      where: { client: { id: user['sub'] } },
      order: { id: 'DESC' },
    });
    return billHistory;
  }
  async findById(id: number) {
    return await this.repository.findOne({
      where: { id },
      relations: { addedBy: true },
    });
  }
  async postBills(user: User, billDto: BillDto) {
    const currentDate = new Date(); // Current date for the end date

    const whereCondition: any = {
      interpreter: { id: user.id },
      status: Billing_Status.PENDING,
    };
    // Check if there are any existing bills for the user (interpreter or client)
    const lastBill = await this.billRepo.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' }, // Get the latest bill
    });
    // Determine the start date for the new bill
    const startDate = lastBill ? new Date(lastBill.createdAt) : null;
    if (startDate) {
      // Set start date to one day after the last bill's createdAt date
      startDate.setDate(startDate.getDate());
      whereCondition.createdAt = MoreThanOrEqual(startDate);
    }
    console.log('Conditions', whereCondition);
    if (billDto.role === 'interpreter') {
      const pendingBills = await this.billingRepository.find({
        where: whereCondition,
        order: { createdAt: 'ASC' }, // Get bills starting from the start date
      });

      if (pendingBills.length === 0) {
        throw new BadRequestException(
          'No pending bills found for this period.',
        );
      }

      // Set the bill's start date (from the first pending bill)
      billDto.from = startDate || pendingBills[0].createdAt;

      // Calculate total amount
      const totalPending = pendingBills.reduce(
        (sum, bill) => sum + Number(bill.amount),
        0,
      );

      billDto.amount = totalPending;
      return await this.billRepo.save(billDto);
    } else if (billDto.role === 'client') {
      const unpaidCalls = await this.callRepository.find({
        where: {
          client: { id: user.id },
          status: 'pending',
          createdAt: startDate ? MoreThanOrEqual(startDate) : undefined,
        },
        order: { createdAt: 'ASC' }, // Get unpaid calls from the start date
      });

      if (unpaidCalls.length === 0) {
        throw new BadRequestException('No unpaid calls found for this period.');
      }

      // Set the bill's start date (from the first unpaid call)
      billDto.from = startDate || unpaidCalls[0].createdAt;

      // Calculate total unpaid amount
      const totalUnpaid = unpaidCalls.reduce(
        (sum, call) => sum + Number(call.bill),
        0,
      );

      billDto.amount = totalUnpaid;
      return await this.billRepo.save(billDto);
    }
  }

  async userExists(email: string) {
    const user = await this.repository.findOne({ where: { email } });
    if (user) {
      return true;
    } else {
      return false;
    }
  }
  async findOneByEmail(email: string) {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('password')
      .where('user.email = :email', { email })
      .getRawOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.repository.update(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
