import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
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
  async findbyId(id: number) {
    return await this.repository.findOne({ where: { id } });
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
