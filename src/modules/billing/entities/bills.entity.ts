import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Assuming you have a User entity for interpreters
import { BaseEntity } from 'src/base.entity';
import { Billing_Status } from '../enum/billingStatus.enum';
import { Roles } from 'src/modules/users/enums/roles.enum';

@Entity('bills')
export class Bill extends BaseEntity {
  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'user_Id' })
  user: User;

  @Column({
    type: 'enum',
    enum: Billing_Status,
    default: Billing_Status.PENDING,
  })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Roles,
    default: Roles.CLIENT,
  })
  role: string;
}
