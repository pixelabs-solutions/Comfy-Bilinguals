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
  async getUsers(role: Roles, user: User) {
    const users = await this.repository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.status',
        'user.role',
      ])
      .where('user.role = :role', { role })
      .getMany();

    let filteredUsers = [];
    for (const user of users) {
      const condition = await this.checkBills(user.id, user.role);
      console.log(condition);
      if (condition) {
        filteredUsers.push(user);
      } else continue;
    }

    return filteredUsers;
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
    console.log(startDate);
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
      console.log('Pending Bills', pendingBills);
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

  async checkBills(id: number, role: string): Promise<boolean> {
    let totalAmount = 0;
    let billsSum = 0;
    // Fetch pending bills for the user (both client and interpreter)
    const pendingBills = await this.billRepo.find({
      where: { user: { id: id }, status: Billing_Status.PENDING },
    });
    // Calculate the sum of the bills from the billRepo
    if (pendingBills && pendingBills.length > 0) {
      billsSum = pendingBills.reduce(
        (acc, bill) => acc + Number(bill.amount || 0),
        0,
      );
    }
    // Role-based logic: either check client or interpreter's records
    if (role === 'client') {
      // Fetch pending call history for the client and sum the bill amounts
      const pendingCalls = await this.callRepository.find({
        where: { client: { id: id }, status: Billing_Status.PENDING },
      });

      if (pendingCalls && pendingCalls.length > 0) {
        totalAmount = pendingCalls.reduce(
          (acc, call) => acc + Number(call.bill || 0),
          0,
        );
      }
    } else if (role === 'interpreter') {
      // Fetch pending billing history for the interpreter and sum the amounts
      const interpreterBills = await this.billingRepository.find({
        where: { interpreter: { id: id }, status: Billing_Status.PENDING },
      });
      console.log('Pending Bills:', interpreterBills);
      if (interpreterBills && interpreterBills.length > 0) {
        totalAmount = interpreterBills.reduce(
          (acc, bill) => acc + Number(bill.amount || 0),
          0,
        );
      }
    }
    console.log('Total amount: ' + totalAmount);
    console.log('bill Sum ' + billsSum);
    // Compare the total amount with the sum of the bills
    if (totalAmount > billsSum) {
      return true; // The amount is greater than the summed bills
    } else {
      return false; // The amount is less than or equal to the summed bills
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
